"""Hexwerk 3D-Nachlieferung: Deko-Set, Wasserlauf-Kacheln, Inselsockel, Nebelfeld, Turm-Porträt-Sockel.

Aufruf (headless, Blender 4.4+):
  blender -b --factory-startup -P build_hexwerk3d.py -- [gruppen] [--editions normal,sakura,halloween] [--preview]
Gruppen: decor tiles sockets fog portrait (ohne Angabe: alle).

Je Gruppe und Edition entsteht eine .blend-Datei neben diesem Skript und je Modell eine GLB in assets/
(Editionen in assets/sakura/... bzw. assets/halloween/... mit gleichem Dateinamen).
Konventionen wie docs/ASSET_SPEC.md: Blender X = Osten, Y = Norden, Z = oben, Hex-Umkreisradius 1, Export +Y up.
Vorne (Menü- und Spielkamera) ist -Y, Licht kommt von vorne rechts (+X, -Y).
"""
import bpy, bmesh, math, random, os, sys, json
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
ASSETS = os.path.join(ROOT, 'assets')
R3 = math.sqrt(3)
TILE = 1.1  # Kachelmaßstab der Menü-Inseln (classes/menu-backdrop.js)


# ---------------------------------------------------------------- Farben und Materialien
def lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def col(h):
    if not isinstance(h, str):
        return tuple(h)
    h = h.lstrip('#')
    return tuple(lin(int(h[i:i + 2], 16) / 255) for i in (0, 2, 4))


MATS = {}


def mat(name, color, rough=0.9, emit=0.0, emit_color=None, metal=0.0, tex=None):
    if name in MATS:
        return MATS[name]
    m = bpy.data.materials.new(name)
    try:
        m.use_nodes = True
    except Exception:
        pass
    m.use_backface_culling = False  # doppelseitig: Low-Poly-Teile ohne Rückseiten-Löcher
    b = m.node_tree.nodes.get('Principled BSDF')
    c = col(color)
    b.inputs['Base Color'].default_value = (*c, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emit > 0:
        b.inputs['Emission Color'].default_value = (*col(emit_color or color), 1)
        b.inputs['Emission Strength'].default_value = emit
    if tex is not None:
        n = m.node_tree.nodes.new('ShaderNodeTexImage')
        n.image = tex
        m.node_tree.links.new(n.outputs['Color'], b.inputs['Base Color'])
    m.diffuse_color = (*c, 1)
    MATS[name] = m
    return m


# Paletten aus assets/uidesign/_source/Island.dc.html (base/sakura/halloween), Mitteltöne aus Licht- und Schattenfarbe.
DECOR = {
    'normal': dict(pine='#3b7240', trunk='#5a3d25', crown='#4d8a42', crownHi='#86b85c', bush='#4f8840', bushHi='#6aa44f',
                   grass='#4f7a36', grassLit='#73a650', flowers=['#f2d34f', '#f6f2e4', '#e88aa6'], rock='#7d8178', ledge='#b9bcb0',
                   wood='#8a6440', woodDark='#5e4129', banner='#375aa0', crest='#f3d58a', flame='#ffb347', flameCore='#fff1a8',
                   lamp='#ffd27a', lampBody='#2b2116', water='#4fa3c8', waterDeep='#2f6f93', foam='#e8f6fb', bank='#6b5034'),
}
DECOR['sakura'] = dict(DECOR['normal'], crown='#db82a0', crownHi='#ffd0de', bush='#db84a1', bushHi='#ef9fb8',
                       flowers=['#ffc4d6', '#ffe3ec', '#f590b0'], banner='#f4ecd6', crest='#d9493a', lamp='#ffb0a0', lampBody='#d9493a',
                       rock='#959095', ledge='#cfc8c6', bank='#6b4440')
DECOR['halloween'] = dict(DECOR['normal'], pine='#2e4c33', trunk='#3b2a22', grass='#7a6a38', grassLit='#9a8a48',
                          flowers=['#e07b22', '#f2a33a', '#b25a12'], banner='#553379', crest='#f08a24', flame='#9be36a', flameCore='#e6ffd0',
                          lamp='#ffb347', lampBody='#e07b22', water='#3a5578', waterDeep='#1f3350', foam='#c9d6e0', bank='#3f2c22')

# Boden der Spielkacheln je Edition (linear, aus den vorhandenen tile_*.glb), damit Sockel und Bach nahtlos anschließen.
TILE_MATS = {
    'normal': dict(grass=(0.366, 0.521, 0.133), soil=(0.195, 0.102, 0.042), stone=(0.323, 0.279, 0.238)),
    'sakura': dict(grass=(0.823, 0.451, 0.546), soil=(0.102, 0.042, 0.048), stone=(0.434, 0.407, 0.366)),
    'halloween': dict(grass=(0.109, 0.102, 0.034), soil=(0.044, 0.026, 0.022), stone=(0.212, 0.188, 0.25)),
}
SOCKET = {
    'normal': dict(earth='#74532f', rock='#7d8178', ledge='#b9bcb0'),
    'sakura': dict(earth='#6b4440', rock='#959095', ledge='#cfc8c6'),
    'halloween': dict(earth='#4a3326', rock='#5d5868', ledge='#827b8e'),
}
# assets/uidesign/_source/World.dc.html
FOG = {
    'normal': dict(side='#6e746c', ledge='#b9bdb3', a='#80867e', b='#969c93', bump='#a8ada3', treeD='#2f6a3a', treeL='#4c9145', q='#f4f4ee', qLine='#4f554f', extra=None),
    'sakura': dict(side='#7d7470', ledge='#c9bfb8', a='#8f8681', b='#a39a94', bump='#b8aea7', treeD='#cf6f8e', treeL='#f2a3bb', q='#fff6fa', qLine='#7d4a5c', extra='#e0483a'),
    'halloween': dict(side='#45404d', ledge='#7d7688', a='#5d5868', b='#6e6878', bump='#827b8e', treeD='#1f2a24', treeL='#33443a', q='#e6ffd0', qLine='#2f5a24', extra='#f08a24'),
}


# ---------------------------------------------------------------- Geometrie-Bausteine (Listen aus Punkten und Flächen)
class MB:
    """Ein Mesh mit mehreren Materialien; Teile werden als (verts, faces) hinzugefügt."""

    def __init__(self):
        self.bm = bmesh.new()
        self.uv = self.bm.loops.layers.uv.verify()
        self.mats = []

    def idx(self, m):
        if m not in self.mats:
            self.mats.append(m)
        return self.mats.index(m)

    def add(self, part, m, M=None, uvs=None):
        verts, faces = part[0], part[1]
        vs = [self.bm.verts.new((M @ Vector(v)) if M else Vector(v)) for v in verts]
        for f in faces:
            if len(set(f)) < 3:
                continue
            try:
                face = self.bm.faces.new([vs[j] for j in f])
            except ValueError:
                continue
            if callable(m):
                face.normal_update()
                face.material_index = self.idx(m(face.normal, face.calc_center_median()))
            else:
                face.material_index = self.idx(m)
            if uvs:
                for loop, j in zip(face.loops, f):
                    loop[self.uv].uv = uvs[j]
        return vs

    def finish(self, name, parent=None, weld=True):
        if weld:
            bmesh.ops.remove_doubles(self.bm, verts=self.bm.verts, dist=1e-5)
        me = bpy.data.meshes.new(name)
        self.bm.normal_update()
        self.bm.to_mesh(me)
        self.bm.free()
        for m in self.mats:
            me.materials.append(m)
        for p in me.polygons:
            p.use_smooth = False
        ob = bpy.data.objects.new(name, me)
        bpy.context.scene.collection.objects.link(ob)
        ob.parent = parent
        return ob


def empty(name, parent=None):
    ob = bpy.data.objects.new(name, None)
    ob.empty_display_size = 0.2
    bpy.context.scene.collection.objects.link(ob)
    ob.parent = parent
    return ob


def ring(cx, cy, z, r, n, ph=0.0, rng=None, jr=0.0, jz=0.0, sx=1.0, sy=1.0):
    out = []
    for i in range(n):
        a = ph + 2 * math.pi * i / n
        k = 1 + (rng.uniform(-jr, jr) if rng else 0)
        out.append((cx + math.cos(a) * r * k * sx, cy + math.sin(a) * r * k * sy, z + (rng.uniform(-jz, jz) if rng else 0)))
    return out


def loft(rings, cap0=True, cap1=True):
    verts, faces, starts = [], [], []
    for r in rings:
        starts.append(len(verts))
        verts += r
    for k in range(len(rings) - 1):
        a, b, sa, sb = rings[k], rings[k + 1], starts[k], starts[k + 1]
        if len(a) == len(b):
            n = len(a)
            faces += [(sa + i, sa + (i + 1) % n, sb + (i + 1) % n, sb + i) for i in range(n)]
        elif len(b) == 1:
            faces += [(sa + i, sa + (i + 1) % len(a), sb) for i in range(len(a))]
        elif len(a) == 1:
            faces += [(sa, sb + (i + 1) % len(b), sb + i) for i in range(len(b))]
    if cap0 and len(rings[0]) > 2:
        faces.append(tuple(reversed(range(starts[0], starts[0] + len(rings[0])))))
    if cap1 and len(rings[-1]) > 2:
        faces.append(tuple(range(starts[-1], starts[-1] + len(rings[-1]))))
    return verts, faces


def tube(p0, p1, r0, r1=None, n=5, ph=0.0, caps=True):
    p0, p1 = Vector(p0), Vector(p1)
    d = (p1 - p0).normalized()
    a = d.orthogonal().normalized()
    b = d.cross(a)
    r1 = r0 if r1 is None else r1
    mk = lambda p, r: [tuple(p + (a * math.cos(ph + 2 * math.pi * i / n) + b * math.sin(ph + 2 * math.pi * i / n)) * r) for i in range(n)]
    return loft([mk(p0, r0), mk(p1, r1)], caps, caps)


def box(cx, cy, cz, sx, sy, sz, rz=0.0, ry=0.0):
    """Quader, Mitte unten bei (cx, cy, cz)."""
    M = Matrix.Translation((cx, cy, cz)) @ Matrix.Rotation(rz, 4, 'Z') @ Matrix.Rotation(ry, 4, 'Y')
    pts = lambda z: [tuple(M @ Vector((x * sx / 2, y * sy / 2, z))) for x, y in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    return loft([pts(0), pts(sz)])


def hull(pts):
    bm = bmesh.new()
    vs = [bm.verts.new(p) for p in pts]
    bmesh.ops.convex_hull(bm, input=vs)
    bm.normal_update()
    used = [v for v in bm.verts if v.link_faces]
    ix = {v: i for i, v in enumerate(used)}
    cen = sum((v.co for v in used), Vector()) / max(1, len(used))
    faces = []
    for f in bm.faces:
        ids = [ix[v] for v in f.verts]
        if f.normal.dot(f.calc_center_median() - cen) < 0:
            ids.reverse()
        faces.append(tuple(ids))
    verts = [tuple(v.co) for v in used]
    bm.free()
    return verts, faces


def blob(c, rx, ry, rz, rng, n=16, j=0.12, zmin=None):
    """Facettierter Klumpen (Krone, Busch, Fels): Hülle aus Punkten auf einem Ellipsoid."""
    pts = []
    g = math.pi * (3 - math.sqrt(5))
    for i in range(n):
        z = 1 - 2 * (i + 0.5) / n
        r = math.sqrt(1 - z * z)
        a = g * i + rng.random() * 0.4
        k = 1 + rng.uniform(-j, j)
        p = [c[0] + math.cos(a) * r * rx * k, c[1] + math.sin(a) * r * ry * k, c[2] + z * rz * k]
        if zmin is not None:
            p[2] = max(p[2], zmin)
        pts.append(p)
    return hull(pts)


def rock(c, w, d, h, rng, n=13, embed=0.012):
    """Fels mit flacher Unterseite; Ursprung des Felsens am Boden."""
    pts = [(c[0] + math.cos(a) * w / 2 * rng.uniform(.8, 1), c[1] + math.sin(a) * d / 2 * rng.uniform(.8, 1), c[2] - embed)
           for a in [2 * math.pi * i / 6 + rng.random() * .4 for i in range(6)]]
    for i in range(n - 6):
        a = rng.random() * 2 * math.pi
        t = rng.uniform(.15, 1)
        rr = math.sqrt(max(0, 1 - t * t * .85))
        pts.append((c[0] + math.cos(a) * w / 2 * rr * rng.uniform(.7, 1), c[1] + math.sin(a) * d / 2 * rr * rng.uniform(.7, 1), c[2] + t * h))
    pts.append((c[0] + rng.uniform(-.15, .15) * w, c[1] + rng.uniform(-.15, .15) * d, c[2] + h))
    return hull(pts)


def top_split(top, side, limit=0.72):
    """Materialwahl je Fläche: nach oben zeigende Facetten hell (Felskante wie in der Leinwand)."""
    return lambda n, c: top if n.z > limit else side


def pumpkin(c, R, h, n=10, rib=0.86):
    prof = [(0.0, .35), (.12, .82), (.5, 1.0), (.86, .8), (1.0, .32)]
    rings = []
    for t, r in prof:
        rings.append([(c[0] + math.cos(2 * math.pi * i / n) * R * r * (1 if i % 2 == 0 else rib),
                       c[1] + math.sin(2 * math.pi * i / n) * R * r * (1 if i % 2 == 0 else rib), c[2] + t * h) for i in range(n)])
    return loft(rings)


def octa(c, r, h=None):
    h = h or r
    return loft([[(c[0], c[1], c[2] - h)], ring(c[0], c[1], c[2], r, 4), [(c[0], c[1], c[2] + h)]], False, False)


def hexring(r, z, n_sub=1, ph=math.pi / 6):
    """Punkte eines spitzen Hex (Ecken bei ±Y) mit Unterteilung je Kante."""
    corners = [(math.cos(ph + i * math.pi / 3) * r, math.sin(ph + i * math.pi / 3) * r) for i in range(6)]
    out = []
    for i in range(6):
        a, b = corners[i], corners[(i + 1) % 6]
        for k in range(n_sub):
            t = k / n_sub
            out.append((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, z))
    return out


def tri_count(ob):
    return sum(len(p.vertices) - 2 for p in ob.data.polygons) if ob.type == 'MESH' else 0


# ---------------------------------------------------------------- Deko-Set
def pine(mb, H, rng, P, x=0.0, y=0.0, mpine=None, mtrunk=None):
    mpine = mpine or mat('foliage_pine', P['pine'])
    mtrunk = mtrunk or mat('timber', P['trunk'])
    mb.add(tube((x, y, -0.01), (x, y, 0.26 * H), 0.05 * H, 0.035 * H, 5, rng.random()), mtrunk)
    for b, a, w in ((0.14, 0.56, 0.34), (0.38, 0.80, 0.27), (0.60, 1.0, 0.19)):
        n, ph = 7, rng.random() * 6.28
        base = ring(x, y, b * H, w * H, n, ph, rng, .09, .025 * H)
        mid = ring(x + rng.uniform(-.01, .01) * H, y, (b + (a - b) * .42) * H, w * H * .6, n, ph + .2, rng, .06, .01 * H)
        apex = [(x + rng.uniform(-.025, .025) * H, y + rng.uniform(-.025, .025) * H, a * H)]
        under = [(x, y, (b + .07) * H)]
        mb.add(loft([under, base, mid, apex], False, False), mpine)


def leafy(mb, H, wide, rng, P):
    mb.add(tube((0, 0, -0.01), (0, 0, .5 * H), .065 * H, .04 * H, 6, rng.random()), mat('timber', P['trunk']))
    mb.add(tube((0, 0, .3 * H), (.16 * H, -.04 * H, .5 * H), .025 * H, .015 * H, 4), mat('timber', P['trunk']))
    R, cz = (.38 if wide else .3) * H, .62 * H
    crown, hi = mat('foliage_crown', P['crown']), mat('foliage_crown_light', P['crownHi'])
    mb.add(blob((0, 0, cz), R * 1.12, R * 1.0, R * .95, rng, 20, .1), crown)
    if wide:
        mb.add(blob((-.32 * H, .05 * H, .55 * H), R * .62, R * .6, R * .55, rng, 14, .12), crown)
        mb.add(blob((.3 * H, .08 * H, .58 * H), R * .58, R * .55, R * .52, rng, 14, .12), crown)
    mb.add(blob((R * .38, -R * .42, cz + R * .5), R * .45, R * .4, R * .32, rng, 12, .1), hi)


def bare_tree(mb, H, wide, rng, P):
    wood = mat('hw_deadwood', P['trunk'])
    lit = mat('hw_deadwood_light', '#5a4232')
    H2 = H * .95
    mb.add(loft([ring(0, 0, -.01, .075 * H2, 6, 0, rng, .1), ring(.01 * H2, 0, .3 * H2, .045 * H2, 6, .3, rng, .1),
                 ring(-.01 * H2, .01 * H2, .62 * H2, .028 * H2, 6, .5)]), wood)
    spec = [((0, 0, .4), (-.32, .06, .82), .05), ((0, 0, .5), (.3, -.08, .86), .05), ((0, 0, .6), (.04, .1, 1.0), .045)]
    if wide:
        spec += [((0, 0, .34), (.36, .18, .66), .04), ((0, 0, .45), (-.2, -.26, .78), .04)]
    for p0, p1, w in spec:
        mb.add(tube([v * H2 for v in p0], [v * H2 for v in p1], w * H2 / 2, w * H2 / 6, 5, rng.random()), wood)
    for p0, p1 in (((-.16, .03, .61), (-.36, .1, .64)), ((.15, -.04, .68), (.36, -.06, .66)), ((.02, .06, .85), (-.1, .16, .95))):
        mb.add(tube([v * H2 for v in p0], [v * H2 for v in p1], .016 * H2, .005 * H2, 4), lit)


def bush(mb, W, rng, P, ed):
    if ed == 'halloween':
        mb.add(pumpkin((0, 0, 0), .42 * W, .52 * W), mat('hw_pumpkin', '#d06c1a', .6))
        mb.add(tube((0, 0, .48 * W), (.03 * W, .01 * W, .68 * W), .05 * W, .03 * W, 5), mat('hw_stem', '#4f7a36'))
        return
    m, hi = mat('foliage_bush', P['bush']), mat('foliage_bush_light', P['bushHi'])
    mb.add(blob((-.2 * W, 0, .3 * W), .36 * W, .32 * W, .32 * W, rng, 14, .12, zmin=0), m)
    mb.add(blob((.22 * W, .04 * W, .26 * W), .32 * W, .3 * W, .28 * W, rng, 14, .12, zmin=0), m)
    mb.add(blob((.04 * W, -.12 * W, .42 * W), .2 * W, .16 * W, .14 * W, rng, 10, .1), hi)


def grass(mb, W, rng, P):
    a, b = mat('grass_blade', P['grass']), mat('grass_blade_light', P['grassLit'])
    for i, (x, h) in enumerate(zip([-.4, -.2, 0, .2, .4], [.5, .75, .9, .65, .45])):
        y = rng.uniform(-.18, .18) * W
        tip = (x * W + (i - 2) * .07 * W, y + rng.uniform(-.05, .05) * W, h * W)
        base = ring(x * W, y, 0, .07 * W, 3, rng.random() * 6.28)
        mb.add(loft([base, [tip]], True, False), a if i % 2 else b)


def flowers(mb, W, rng, P, ed):
    stem = mat('flower_stem', P['grass'])
    heads = [mat('flower_a', P['flowers'][0], .8), mat('flower_b', P['flowers'][1], .8), mat('flower_c', P['flowers'][2], .8)]
    if ed == 'halloween':
        for i, (x, y, R) in enumerate(((-.3, .05, .17), (.18, -.08, .22), (.36, .22, .14))):
            mb.add(pumpkin((x * W, y * W, 0), R * W, R * W * 1.25, 8), heads[i])
            mb.add(tube((x * W, y * W, R * W * 1.15), (x * W + .02 * W, y * W, R * W * 1.15 + .1 * W), .025 * W, .015 * W, 4), stem)
        return
    for i, (x, h) in enumerate([(-.35, .5), (-.1, .8), (.15, .6), (.38, .75), (0, .45)]):
        y = rng.uniform(-.25, .25) * W
        top = (x * W + rng.uniform(-.03, .03) * W, y, h * W * .6)
        mb.add(tube((x * W, y, 0), top, .012 * W, .008 * W, 3), stem)
        r = .1 * W
        mb.add(loft([[(top[0], top[1], top[2] - r * .5)], ring(top[0], top[1], top[2], r, 5, rng.random()), [(top[0], top[1], top[2] + r * .35)]], False, False), heads[i % 3])
    if ed == 'sakura':  # Blütenblätter auf dem Boden
        for i in range(6):
            a, d = rng.random() * 6.28, rng.uniform(.3, .6) * W
            mb.add(loft([ring(math.cos(a) * d, math.sin(a) * d, .003, .03 * W, 3, rng.random() * 6.28)], True, False), heads[i % 3])


def rock_set(mb, kind, rng, P):
    m = top_split(mat('stone_ledge', P['ledge']), mat('stone', P['rock']))
    if kind == 'a':
        mb.add(rock((0, 0, 0), .12, .1, .09, rng), m)
    elif kind == 'b':
        mb.add(rock((0, 0, 0), .15, .13, .19, rng, 15), m)
    else:
        mb.add(rock((-.03, 0, 0), .19, .15, .12, rng, 15), m)
        mb.add(rock((.11, -.03, 0), .1, .09, .065, rng), m)
        mb.add(rock((.06, .09, 0), .06, .05, .035, rng, 9), m)


def fence(mb, rng, P):
    wood, dark = mat('wood', P['wood']), mat('wood_dark', P['woodDark'])
    for x in (-.13, 0, .13):
        tilt = rng.uniform(-.05, .05)
        M = Matrix.Translation((x, 0, 0)) @ Matrix.Rotation(tilt, 4, 'Y')
        mb.add(loft([ring(0, 0, -.01, .013, 4, math.pi / 4), ring(0, 0, .11, .013, 4, math.pi / 4), [(0, 0, .128)]], True, False), dark, M)
    for z, s in ((.05, .017), (.088, .015)):
        mb.add(box(0, -.016, z, .31, .012, s, 0, rng.uniform(-.03, .03)), wood)


def torch(mb, rng, P):
    mb.add(tube((0, 0, -.01), (0, 0, .19), .014, .011, 5), mat('wood_dark', P['woodDark']))
    mb.add(loft([ring(0, 0, .18, .018, 6), ring(0, 0, .215, .034, 6)], True, True), mat('iron', '#3a2a1c', .6, metal=.3))
    flame = mat('flame', P['flame'], .5, 3.0)
    core = mat('flame_core', P['flameCore'], .5, 4.0)
    mb.add(loft([[(0, 0, .208)], ring(0, 0, .235, .026, 5, .3, rng, .1), ring(0, 0, .262, .017, 5, .6, rng, .1), [(.004, -.002, .315)]], False, False), flame)
    mb.add(loft([[(0, -.012, .214)], ring(0, -.014, .236, .012, 4, .2), [(0, -.014, .275)]], False, False), core)


def lantern(mb, rng, P, ed):
    dark = mat('wood_dark', P['woodDark'])
    mb.add(tube((0, 0, -.01), (0, 0, .31), .013, .011, 5), dark)
    mb.add(box(.045, 0, .292, .12, .016, .014), dark)
    X, Z = .085, .21
    if ed == 'sakura':
        body = mat('chochin', P['lampBody'], .7, 1.2, '#ff8f78')
        lac = mat('lacquer', '#1a1416', .4)
        mb.add(tube((X, 0, .292), (X, 0, .262), .003, .003, 4), lac)
        prof = [(-1, .45), (-.7, .85), (0, 1), (.7, .85), (1, .45)]
        mb.add(loft([ring(X, 0, Z + t * .045, .036 * r, 8) for t, r in prof]), body)
        mb.add(tube((X, 0, Z + .043), (X, 0, Z + .053), .018, .018, 8), lac)
        mb.add(tube((X, 0, Z - .053), (X, 0, Z - .043), .018, .018, 8), lac)
        return
    if ed == 'halloween':
        mb.add(tube((X, 0, .292), (X, 0, .255), .003, .003, 4), dark)
        mb.add(pumpkin((X, 0, Z - .035), .045, .065), mat('hw_pumpkin', P['lampBody'], .6))
        mb.add(tube((X, 0, Z + .028), (X + .005, 0, Z + .045), .008, .005, 5), mat('hw_stem', '#4f7a36'))
        glow = mat('hw_glow', P['lamp'], .5, 3.0)
        yf = -.046
        for ex in (-.016, .016):  # Augen
            mb.add(loft([[(X + ex - .009, yf, Z - .002), (X + ex + .009, yf, Z - .002), (X + ex, yf, Z + .013)],
                         [(X + ex - .009, yf + .012, Z - .002), (X + ex + .009, yf + .012, Z - .002), (X + ex, yf + .012, Z + .013)]]), glow)
        mb.add(loft([[(X - .022, yf, Z - .014), (X + .022, yf, Z - .014), (X, yf - .001, Z - .028)],
                     [(X - .022, yf + .012, Z - .014), (X + .022, yf + .012, Z - .014), (X, yf + .011, Z - .028)]]), glow)
        return
    body = mat('lantern_metal', P['lampBody'], .6, metal=.3)
    glow = mat('lantern_glow', P['lamp'], .5, 3.0)
    mb.add(tube((X, 0, .292), (X, 0, .268), .003, .003, 4), body)
    mb.add(loft([ring(X, 0, .262, .04, 4, math.pi / 4), [(X, 0, .29)]], True, False), body)
    mb.add(box(X, 0, .255, .05, .05, .008), body)
    mb.add(box(X, 0, .195, .05, .05, .008), body)
    mb.add(box(X, 0, .2, .042, .042, .058), glow)
    for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
        mb.add(box(X + sx * .022, sy * .022, .2, .007, .007, .058), body)


def banner(mb, rng, P):
    dark = mat('wood_dark', P['woodDark'])
    cloth = mat('banner_cloth', P['banner'], .95)
    crest = mat('crest_gold', P['crest'], .5, metal=.35)
    H = .3
    mb.add(tube((0, 0, -.01), (0, 0, H), .012, .01, 5), dark)
    mb.add(octa((0, 0, H + .014), .012, .016), crest)
    mb.add(box(.055, 0, H - .022, .135, .014, .013), dark)
    x0, x1, top, bot, notch, t = .018, .112, H - .024, H - .205, .035, .004
    cols = [x0, (x0 + x1) / 2, x1]
    wave = lambda x: math.sin((x - x0) / (x1 - x0) * math.pi * 1.4) * .008
    front = [(x, -t + wave(x), top) for x in cols] + [(x, -t + wave(x), bot + (notch if i == 1 else 0)) for i, x in enumerate(cols)]
    back = [(x, t + wave(x), z) for x, _, z in front]
    verts = front + back
    faces = [(0, 3, 4, 1), (1, 4, 5, 2), (8, 11, 10, 7), (7, 10, 9, 6),
             (0, 1, 7, 6), (1, 2, 8, 7), (2, 5, 11, 8), (5, 4, 10, 11), (4, 3, 9, 10), (3, 0, 6, 9)]
    mb.add((verts, faces), cloth)
    cx, cz, s = cols[1], H - .1, .028
    y = -t + wave(cols[1]) - .003
    dia = [(cx, y, cz + s), (cx + s * .7, y, cz), (cx, y, cz - s), (cx - s * .7, y, cz)]
    mb.add(loft([dia, [(p[0], p[1] - .004, p[2]) for p in dia]]), crest)


def bridge(mb, rng, P):
    wood, dark = mat('wood', P['wood']), mat('wood_dark', P['woodDark'])
    L, Wd = .62, .2
    zf = lambda x: .012 + .045 * (1 - (2 * x / L) ** 2)
    n = 9
    for i in range(n):
        x = -L / 2 + (i + .5) * L / n
        slope = -.045 * 8 * x / L ** 2
        mb.add(box(x, rng.uniform(-.006, .006), zf(x), L / n * .86, Wd + rng.uniform(-.01, .01), .016, rng.uniform(-.03, .03), -math.atan(slope)), wood)
    xs = [-L / 2 + L * i / 8 for i in range(9)]
    for y in (-.085, .085):
        for i in range(8):
            a, b = xs[i], xs[i + 1]
            mb.add(tube((a, y, zf(a) - .012), (b, y, zf(b) - .012), .014, None, 4, math.pi / 4), dark)
            mb.add(tube((a, y, zf(a) + .095), (b, y, zf(b) + .095), .008, None, 4, math.pi / 4), wood)
        for x in (-.5 * L, -.17 * L, .17 * L, .5 * L):
            x = max(-L / 2 + .012, min(L / 2 - .012, x))
            mb.add(box(x, y, zf(x) - .02, .018, .018, .125), dark)


def pond(mb, rng, P):
    water = mat('water', '#ffffff', .25, tex=WATER_IMG)
    bank = mat('pond_bank', P['bank'])
    pts = ring(0, 0, .006, .42, 9, rng.random(), rng, .08)
    rim = [(p[0] * 1.12, p[1] * 1.12, .014) for p in pts]
    mb.add(loft([rim, pts], False, False), bank)
    uvs = [((p[0] + .5) * 1.4, (p[1] + .5) * 1.4) for p in pts] + [(.7, .7)]
    mb.add((pts + [(0, 0, .002)], [(i, (i + 1) % 9, 9) for i in range(9)]), water, uvs=uvs)
    stone = top_split(mat('stone_ledge', P['ledge']), mat('stone', P['rock']))
    for i in range(5):
        a = rng.random() * 6.28
        mb.add(rock((math.cos(a) * .47, math.sin(a) * .47, 0), .08, .07, .03, rng, 9), stone)


DECOR_ITEMS = ['deco_pine_s', 'deco_pine_m', 'deco_pine_l', 'deco_tree_a', 'deco_tree_b', 'deco_bush', 'deco_grass', 'deco_flowers',
               'deco_rock_a', 'deco_rock_b', 'deco_rock_c', 'deco_fence', 'deco_torch', 'deco_lantern', 'deco_banner', 'deco_bridge', 'deco_pond',
               'decor_rockIsle']
# Nur Teile, die sich je Edition sichtbar unterscheiden, bekommen eine Editionsdatei; sonst lädt das Spiel die normale.
DECOR_EDITIONS = {
    'sakura': ['deco_tree_a', 'deco_tree_b', 'deco_bush', 'deco_flowers', 'deco_lantern', 'deco_banner', 'deco_rock_a', 'deco_rock_b', 'deco_rock_c', 'decor_rockIsle'],
    'halloween': ['deco_pine_s', 'deco_pine_m', 'deco_pine_l', 'deco_tree_a', 'deco_tree_b', 'deco_bush', 'deco_grass', 'deco_flowers',
                  'deco_torch', 'deco_lantern', 'deco_banner', 'deco_pond', 'decor_rockIsle'],
}


def rock_isle(mb, rng, ed):
    F = FOG[ed]
    top, side = mat('rock_top', F['a']), mat('rock_side', F['side'])
    n = 9
    rim = ring(0, 0, 0, .42, n, rng.random(), rng, .12, .015, 1.15, .85)
    mid = ring(0, 0, .035, .22, n, .2, rng, .15, .01, 1.15, .85)
    mb.add(loft([rim, mid, [(.02, .01, .05)]], False, False), top)
    lower = [(p[0] * .82, p[1] * .82, -.16 + rng.uniform(-.03, .03)) for p in rim]
    low2 = [(p[0] * .45, p[1] * .45, -.36 + rng.uniform(-.05, .05)) for p in rim]
    mb.add(loft([[(0, 0, -.55)], low2, lower, rim], False, False), side)
    mb.add(rock((-.18, -.12, .01), .12, .1, .08, rng), top_split(top, side))
    trunk = mat('timber', DECOR[ed]['trunk']) if ed == 'normal' else side
    P = dict(DECOR[ed], pine=F['treeD'])
    if ed == 'sakura':
        for x, y, H in ((-.12, .1, .28), (.14, .06, .22)):
            mb.add(tube((x, y, 0), (x, y, .45 * H), .035 * H * 1.4, .02 * H * 1.4, 5), trunk)
            mb.add(blob((x, y, .62 * H), .3 * H, .28 * H, .26 * H, rng, 14, .12), mat('foliage_blossom', F['treeL']))
    else:
        pine(mb, .3, rng, P, -.1, .1, mat('foliage_pine', F['treeD']), trunk)
        pine(mb, .22, rng, P, .14, .06, mat('foliage_pine', F['treeD']), trunk)
    if F['extra']:
        glow = mat('isle_glow', F['extra'], .5, 2.0)
        if ed == 'halloween':
            mb.add(pumpkin((.22, -.14, 0), .05, .06), glow)
        else:
            mb.add(tube((.24, -.12, 0), (.24, -.12, .1), .008, .008, 4), side)
            mb.add(loft([ring(.24, -.12, .1 + t * .028, .024 * r, 8) for t, r in ((-1, .5), (-.6, .9), (0, 1), (.6, .9), (1, .5))]), glow)


def build_decor(ed):
    P = DECOR[ed]
    items = DECOR_ITEMS if ed == 'normal' else DECOR_EDITIONS[ed]
    made = []
    for i, name in enumerate(items):
        rng = random.Random(hash_name(name))
        root = empty(name)
        mb = MB()
        if name.startswith('deco_pine'):
            pine(mb, {'s': .24, 'm': .34, 'l': .45}[name[-1]], rng, P)
        elif name.startswith('deco_tree'):
            (bare_tree if ed == 'halloween' else leafy)(mb, .32 if name.endswith('a') else .38, name.endswith('b'), rng, P)
        elif name == 'deco_bush':
            bush(mb, .2, rng, P, ed)
        elif name == 'deco_grass':
            grass(mb, .1, rng, P)
        elif name == 'deco_flowers':
            flowers(mb, .16, rng, P, ed)
        elif name.startswith('deco_rock'):
            rock_set(mb, name[-1], rng, P)
        elif name == 'deco_fence':
            fence(mb, rng, P)
        elif name == 'deco_torch':
            torch(mb, rng, P)
        elif name == 'deco_lantern':
            lantern(mb, rng, P, ed)
        elif name == 'deco_banner':
            banner(mb, rng, P)
        elif name == 'deco_bridge':
            bridge(mb, rng, P)
        elif name == 'deco_pond':
            pond(mb, rng, P)
        elif name == 'decor_rockIsle':
            rock_isle(mb, rng, ed)
        mb.finish(name + '_mesh', root)
        made.append((root, os.path.join(ASSETS, *edpath(ed), 'decor', name + '.glb')))
    return made


def hash_name(s):
    return sum((i + 1) * ord(c) for i, c in enumerate(s))


# ---------------------------------------------------------------- Wasserlauf-Kacheln
def water_image(ed):
    P = DECOR[ed]
    name = 'water_ripple' if ed == 'normal' else 'water_ripple_' + ed
    path = os.path.join(HERE, name + '.png')
    W = 128
    img = bpy.data.images.new(name, W, W, alpha=False)
    hx = lambda h: [int(h.lstrip('#')[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    c1, c2, fo = hx(P['water']), hx(P['waterDeep']), hx(P['foam'])
    px = []
    for j in range(W):
        v = j / W
        for i in range(W):
            u = i / W
            t = .5 + .5 * math.sin(2 * math.pi * (3 * v + .35 * math.sin(2 * math.pi * (2 * u + v))))
            s = .5 + .5 * math.sin(2 * math.pi * (5 * u + 2 * v + .5 * math.sin(2 * math.pi * 3 * v)))
            k = .25 + .55 * t + .2 * s
            c = [c2[x] + (c1[x] - c2[x]) * k for x in range(3)]
            streak = math.sin(2 * math.pi * (4 * u + .6 * math.sin(2 * math.pi * v) + 2 * v))
            if streak > .95 and t > .55:
                c = [c[x] + (fo[x] - c[x]) * .35 for x in range(3)]
            px += [c[0], c[1], c[2], 1.0]
    img.pixels = px
    img.filepath_raw = path
    img.file_format = 'PNG'
    img.save()
    return img


def hex_prism(r, z_top, z_split, z_bot):
    rings = [hexring(r, z_bot), hexring(r, z_split), hexring(r, z_top)]
    return loft(rings)


def river_path(kind, n=10):
    """Mittellinie (Punkt, Tangente); das Wasser fließt immer zur Kante 0 (Osten, +X)."""
    out = []
    if kind == 'curve':  # Kanten 2 -> 0, Kreis um die Nachbarmitte (0.866, 1.5) wie bigCurve
        C, R = Vector((R3 / 2, 1.5)), 1.5
        for i in range(n + 1):
            a = math.radians(210 + 60 * i / n)
            out.append((Vector((C.x + math.cos(a) * R, C.y + math.sin(a) * R)), Vector((-math.sin(a), math.cos(a)))))
    else:
        for i in range(n + 1):
            out.append((Vector((-R3 / 2 + R3 * i / n, 0)), Vector((1, 0))))
    return out


def strip(path, half, z, u0=0.0, uscale=1 / .55):
    verts, uvs, faces, s = [], [], [], u0
    prev = None
    for k, (p, t) in enumerate(path):
        nrm = Vector((-t.y, t.x))
        if prev is not None:
            s += (p - prev).length * uscale
        prev = p
        for side, v in ((-1, 0.0), (1, 1.0)):
            q = p + nrm * half * side
            verts.append((q.x, q.y, z))
            uvs.append((s, v))
    for k in range(len(path) - 1):
        a = 2 * k
        faces.append((a, a + 2, a + 3, a + 1))
    return verts, faces, uvs, s


def build_river(kind, ed):
    T = TILE_MATS[ed]
    name = {'straight': 'tile_river_straight', 'curve': 'tile_river_curve', 'fall': 'tile_river_fall'}[kind]
    root = empty(name)
    rng = random.Random(hash_name(name))
    grass = mat('grass_meadow', T['grass'], 1.0)
    soil = mat('soil_earth', T['soil'], 1.0)
    water = mat('water', '#ffffff', .25, tex=WATER_IMG)
    # Boden als geschlossenes Hexprisma, Bachbett per Boolean ausgeschnitten.
    gb = MB()
    gb.add(hex_prism(1.0, 0.0, -0.04, -0.15), soil)
    ground = gb.finish('ground', root)
    path = river_path('curve' if kind == 'curve' else 'straight', 14)
    half_cut, ext = .2, .14
    left = [p + Vector((-t.y, t.x)) * half_cut for p, t in path]
    right = [p - Vector((-t.y, t.x)) * half_cut for p, t in path]
    p0, t0 = path[0]
    p1, t1 = path[-1]
    e0 = ext
    e1 = .35 if kind == 'fall' else ext
    poly = [left[0] - t0 * e0] + left + [left[-1] + t1 * e1, right[-1] + t1 * e1] + list(reversed(right)) + [right[0] - t0 * e0]
    if sum(a.x * b.y - b.x * a.y for a, b in zip(poly, poly[1:] + poly[:1])) < 0:
        poly.reverse()  # gegen den Uhrzeigersinn, sonst steht der Schneidkörper innen nach außen
    cb = MB()
    bot = [(q.x, q.y, -0.075) for q in poly]
    top = [(q.x, q.y, 0.3) for q in poly]
    n = len(poly)
    faces = [tuple(reversed(range(n))), tuple(range(n, 2 * n))] + [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
    cb.add((bot + top, faces), soil)
    cutter = cb.finish('cutter', None)
    mod = ground.modifiers.new('cut', 'BOOLEAN')
    mod.operation = 'DIFFERENCE'
    mod.object = cutter
    try:
        mod.solver = 'EXACT'
    except Exception:
        pass
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(ground.evaluated_get(dg))
    ground.modifiers.clear()
    old = ground.data
    ground.data = me
    bpy.data.meshes.remove(old)
    bpy.data.objects.remove(cutter)
    me.materials.clear()
    me.materials.append(grass)
    me.materials.append(soil)
    for p in me.polygons:
        c = p.center
        outer = math.hypot(c.x, c.y) > .8 and abs(p.normal.z) < .3
        p.material_index = 0 if (p.normal.z > .9 and c.z > -.005) or (outer and c.z > -.04) else 1
        p.use_smooth = False
    # Wasser, leicht unter der Kante; u läuft in Fließrichtung (UV-Scroll entlang u).
    verts, faces, uvs, s_end = strip(path, .175, -.03)
    wb = MB()
    wb.add((verts, faces), water, uvs=uvs)
    if kind == 'fall':
        prof = [(R3 / 2, -.03), (.9, -.045), (.935, -.12), (.96, -.3), (.975, -.6), (.985, -.9), (.99, -1.15)]
        fv, fuv, s = [], [], s_end
        for k, (x, z) in enumerate(prof):
            if k:
                s += math.hypot(x - prof[k - 1][0], z - prof[k - 1][1]) / .55
            h = .175 + .04 * k / (len(prof) - 1)
            fv += [(x, -h, z), (x, h, z)]
            fuv += [(s, 0.0), (s, 1.0)]
        ff = [(2 * k, 2 * k + 2, 2 * k + 3, 2 * k + 1) for k in range(len(prof) - 1)]
        wb.add((fv, ff), water, uvs=fuv)
    wb.finish('water', root)
    extra = MB()
    if kind == 'fall':
        foam = mat('foam', DECOR[ed]['foam'], .6)
        for k in range(7):  # Gischt am Fuß des Falls, flach ausgebreitet
            a = math.radians(-80 + 160 * k / 6)
            extra.add(blob((.99 + math.cos(a) * .12, math.sin(a) * .2, -1.16), .09, .08, .035, rng, 12, .12), foam)
        for y in (-.1, .0, .1):  # Schaumkante oben
            extra.add(blob((.875, y, -.032), .035, .05, .012, rng, 8, .1), foam)
        for y in (-.09, .07):  # Schaumstreifen im Fall
            extra.add(box(.975, y, -.95, .004, .016, .82, 0, -.025), foam)
        extra.finish('foam', root)
    else:
        stone = mat('stone', T['stone'], .95)
        for k in range(7):
            p, t = path[int(len(path) * (.15 + .7 * rng.random()))]
            side = 1 if k % 2 else -1
            q = p + Vector((-t.y, t.x)) * side * rng.uniform(.23, .3)
            extra.add(rock((q.x, q.y, 0), rng.uniform(.07, .11), rng.uniform(.06, .09), rng.uniform(.03, .055), rng, 10), stone)
        extra.finish('bank_stones', root)
    return root


def build_tiles(ed):
    out = []
    for kind in ('straight', 'curve', 'fall'):
        root = build_river(kind, ed)
        out.append((root, os.path.join(ASSETS, *edpath(ed), 'tiles', root.name + '.glb')))
    return out


# ---------------------------------------------------------------- Inselsockel
ISLAND_FILE = os.path.join(HERE, 'islands.json')  # aus classes/menu-diorama.mjs (siehe README)
DIRS = [(1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1), (0, 1)]


def jit(x, y, k):
    v = math.sin(x * 12.9898 + y * 78.233 + k * 37.719) * 43758.5453
    return (v - math.floor(v)) * 2 - 1


def build_socket(spec, ed, name):
    S, T = SOCKET[ed], TILE_MATS[ed]
    grass = mat('grass_meadow', T['grass'], 1.0)
    earth = mat('soil_earth', S['earth'], 1.0)
    rockm = mat('stone', S['rock'], .95)
    ledge = mat('stone_ledge', S['ledge'], .95)
    rocky = top_split(ledge, rockm, .6)
    rng = random.Random(spec['seed'] * 7 + 3)
    cells = {(q, r): h for q, r, h in spec['tiles']}
    world = lambda q, r: (TILE * R3 * (q + r / 2), TILE * 1.5 * r)
    cx = sum(world(q, r)[0] for q, r in cells) / len(cells)
    cz = sum(world(q, r)[1] for q, r in cells) / len(cells)
    root = empty(name)
    mb = MB()
    R = TILE
    for (q, r), top in cells.items():
        wx, wz = world(q, r)
        X, Y = wx - cx, -(wz - cz)  # three.js z -> Blender -Y
        # Ecken i bei 30° + 60°·i (spitz nach ±Y); Kante e (Richtung DIRS[e], 60°·e) liegt zwischen Ecke e-1 und e.
        corner = lambda i, f: (X + math.cos(math.radians(30 + 60 * i)) * R * f, Y + math.sin(math.radians(30 + 60 * i)) * R * f)
        dE = .44 + .26 * (jit(X, Y, 1) * .5 + .5)
        bottom = -1.0 - .45 * (jit(X, Y, 2) * .5 + .5)
        tip = bottom - .3 - .35 * (jit(X, Y, 3) * .5 + .5)
        # Felssäule unter der Erde, sechseckig und nach unten spitz zulaufend
        def hex_jit(f, z, k, jr, jz):
            pts = []
            for i in range(6):
                px, py = corner(i, f)
                d = Vector((px - X, py - Y)) * (1 + jr * jit(round(px, 3), round(py, 3), k))
                pts.append((X + d.x, Y + d.y, z + jz * jit(round(px, 3), round(py, 3), k + 10)))
            return pts
        rA = hex_jit(.97, top - dE, 4, .025, .03)
        rB = hex_jit(.86, top - dE - .26, 5, .06, .06)
        rC = [(X + (x - X) * .62 / .86 * (1 + .1 * jit(X + i, Y, 6)), Y + (y - Y) * .62 / .86, bottom + .08 * jit(X, Y + i, 7)) for i, (x, y, z) in enumerate(rB)]
        mb.add(loft([[(X + .03 * jit(X, Y, 8), Y, tip)], rC, rB, rA], False, False), rocky)
        # Freie Kanten zur Kamera hin (vorne -Y, Kanten 0 und 3 seitlich): Grasüberhang, Erdwand, Felsstufe.
        # Rückwärtige Kanten 1 und 2 sieht die Menükamera nicht; sie entfallen zugunsten des Dreiecksbudgets.
        for e in (0, 3, 4, 5):
            dq, dr = DIRS[e]
            nb = cells.get((q + dq, r + dr))
            if nb is not None and nb >= top - .01:
                continue
            i0, i1 = (e - 1) % 6, e
            def edge_pts(f, z, k=None, jr=0.0, jz=0.0):
                out = []
                for px, py in (corner(i0, f), corner(i1, f)):
                    d = Vector((px - X, py - Y))
                    if k is not None:
                        d *= 1 + jr * jit(round(px, 3), round(py, 3), k)
                    out.append((X + d.x, Y + d.y, z + (jz * jit(round(px, 3), round(py, 3), k + 20) if k is not None else 0)))
                return out
            rin = edge_pts(.97, top - .002)
            r0 = edge_pts(1.022, top - .002)
            r1 = edge_pts(1.022, top - .06)
            r1b = edge_pts(1.012, top - .07)
            r2 = edge_pts(1.012, top - .19)
            r3 = edge_pts(1.0, top - dE + .02, 11, .03, .03)
            ra = [rA[i0], rA[i1]]
            def band(lo, hi, m):
                mb.add((lo + hi, [(0, 1, 3, 2)]), m)
            band(rin, r0, grass)  # Grasrand oben, deckt die Kachelkante ab
            band(r1, r0, grass)
            band(r1b, r1, grass)
            band(r2, r1b, earth)
            band(r3, r2, earth)
            band(ra, r3, ledge)
            # Grastropfen unter dem Überhang
            for k in range(2):
                if jit(X + e, Y + k, 30) > .2:
                    t = .25 + .5 * (jit(X, Y + e + k, 31) * .5 + .5)
                    a0, a1 = corner(i0, 1.03), corner(i1, 1.03)
                    px, py = a0[0] + (a1[0] - a0[0]) * t, a0[1] + (a1[1] - a0[1]) * t
                    mb.add(loft([ring(px, py, top - .058, .022, 3, rng.random() * 6.28), [(px, py, top - .1 - .03 * rng.random())]], False, False), grass)
            # Felsbrocken an der Wand (wie die Platzhalter)
            if jit(X, Y, 40 + e) > .35:
                a = math.radians(60 * e) + rng.uniform(-.4, .4)
                d = R * .86 * rng.uniform(.95, 1.05)
                z = top - dE - rng.uniform(.0, .25)
                mb.add(rock((X + math.cos(a) * d, Y + math.sin(a) * d, z), rng.uniform(.18, .3), rng.uniform(.16, .26), rng.uniform(.12, .24), rng, 9, .05), rocky)
    mb.finish(name + '_mesh', root)
    return root


def build_sockets(ed):
    with open(ISLAND_FILE) as f:
        islands = json.load(f)
    out = []
    for spec in islands:
        name = 'island_socket_left' if spec['side'] < 0 else 'island_socket_right'
        root = build_socket(spec, ed, name)
        out.append((root, os.path.join(ASSETS, *edpath(ed), 'decor', name + '.glb')))
    return out


# ---------------------------------------------------------------- Nebelfeld
def qmark_mesh(height, depth, offset=0.0):
    font = None
    for path in ('C:/Windows/Fonts/georgiab.ttf', 'C:/Windows/Fonts/arialbd.ttf'):
        if os.path.exists(path):
            font = bpy.data.fonts.load(path, check_existing=True)
            break
    cu = bpy.data.curves.new('qmark', 'FONT')
    cu.body = '?'
    if font:
        cu.font = font
    cu.size = 1
    cu.extrude = depth / 2
    cu.offset = offset
    cu.resolution_u = 3
    ob = bpy.data.objects.new('qmark_tmp', cu)
    bpy.context.scene.collection.objects.link(ob)
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    bpy.data.objects.remove(ob)
    verts = [v.co.copy() for v in me.vertices]
    faces = [tuple(p.vertices) for p in me.polygons]
    bpy.data.meshes.remove(me)
    return verts, faces


def place_qmark(verts, height, ref=None):
    ref = ref or verts
    xs = [v.x for v in ref]
    ys = [v.y for v in ref]
    s = height / (max(ys) - min(ys))
    cxm, y0 = (max(xs) + min(xs)) / 2, min(ys)
    return [((v.x - cxm) * s, -v.z * s, (v.y - y0) * s) for v in verts]


def build_fog(ed):
    F = FOG[ed]
    rng = random.Random(97 + len(ed))
    root = empty('tile_fog')
    top_a, top_b = mat('fog_rock', F['a'], .95), mat('fog_rock_light', F['b'], .95)
    side = mat('fog_rock_side', F['side'], .95)
    mb = MB()
    # Oberseite: Fächer aus 12 Facetten, Mitte leicht erhöht, Ecken auf Höhe 0 (Naht zu Nachbarkacheln)
    outer = hexring(1.0, 0.0, 2)
    mid = []
    for i, p in enumerate(outer):
        f = .58 * (1 + .1 * jit(p[0], p[1], 50))
        mid.append((p[0] * f, p[1] * f, .03 + .03 * (jit(p[0], p[1], 51) * .5 + .5)))
    c = (.04, -.03, .07)
    for i in range(12):
        j = (i + 1) % 12
        m = top_a if (i // 2) % 2 == 0 else top_b
        mb.add(([outer[i], outer[j], mid[j], mid[i]], [(0, 1, 2, 3)]), m)
        mb.add(([mid[i], mid[j], c], [(0, 1, 2)]), top_b if m is top_a else top_a)
    # Seiten bis -0.15 wie normale Kacheln, mit heller Felsstufe vorne
    mb.add(loft([hexring(.97, -.15, 2), hexring(1.0, -.05, 2), outer], True, False), side)
    ledge = mat('fog_rock_light', F['b'])
    for i0, i1 in ((3, 4), (4, 5)):  # vordere Kanten (Ecke bei -Y)
        a = Vector(hexring(1.012, 0, 1)[i0 % 6][:2])
        b = Vector(hexring(1.012, 0, 1)[i1 % 6][:2])
        for t0, t1, z in ((.12, .5, -.07), (.58, .9, -.1)):
            p, q = a.lerp(b, t0), a.lerp(b, t1)
            mb.add(loft([[(p.x, p.y, z), (q.x, q.y, z), (q.x * 1.03, q.y * 1.03, z), (p.x * 1.03, p.y * 1.03, z)],
                         [(p.x, p.y, z + .018), (q.x, q.y, z + .018), (q.x * 1.03, q.y * 1.03, z + .018), (p.x * 1.03, p.y * 1.03, z + .018)]]), ledge)
    bumpm = top_split(top_b, side, .55)
    for x, y, w, h in ((-.5, .05, .26, .13), (.42, .42, .24, .15), (.36, -.5, .2, .1), (-.2, .62, .16, .08)):
        mb.add(rock((x, y, .02), w, w * .8, h, rng, 12), bumpm)
    # Bäume
    trunk = side
    if ed == 'sakura':
        bl = mat('foliage_blossom', F['treeL'])
        for x, y, H in ((-.62, .3, .36), (.62, -.08, .32), (-.47, -.5, .27), (.55, .48, .3)):
            mb.add(tube((x, y, 0), (x, y, .5 * H), .03, .018, 5), trunk)
            mb.add(blob((x, y, .66 * H), .34 * H, .3 * H, .28 * H, rng, 14, .12), bl)
            mb.add(blob((x - .1 * H, y + .06 * H, .52 * H), .2 * H, .2 * H, .18 * H, rng, 10, .12), bl)
    else:
        pm = mat('foliage_pine', F['treeD'])
        for x, y, H in ((-.64, .28, .36), (-.48, -.48, .28), (.64, -.1, .32), (.56, .46, .26)):
            pine(mb, H, rng, None, x, y, pm, trunk)
    if F['extra']:
        glow = mat('fog_glow', F['extra'], .5, 2.5)
        if ed == 'halloween':
            mb.add(pumpkin((-.22, -.68, .0), .07, .085), mat('hw_pumpkin', '#d06c1a', .6))
            yf = -.68 - .072
            for ex in (-.025, .025):
                mb.add(loft([[(-.22 + ex - .012, yf, .035), (-.22 + ex + .012, yf, .035), (-.22 + ex, yf, .055)],
                             [(-.22 + ex - .012, yf + .02, .035), (-.22 + ex + .012, yf + .02, .035), (-.22 + ex, yf + .02, .055)]]), glow)
        else:
            mb.add(tube((-.24, -.62, 0), (-.24, -.62, .13), .01, .01, 4), side)
            mb.add(loft([ring(-.24, -.62, .135 + t * .035, .03 * r, 8) for t, r in ((-1, .5), (-.6, .9), (0, 1), (.6, .9), (1, .5))]), glow)
    mb.finish('ground', root)
    # Großes „?“ als Modell: helle Glyphe mit dunkler Kontur dahinter, um 30° zur Spielkamera geneigt
    qb = MB()
    qv, qf = qmark_mesh(1, .14)
    ov, of = qmark_mesh(1, .1, .045)
    H = .58
    M = Matrix.Translation((0, .02, .03)) @ Matrix.Rotation(math.radians(-30), 4, 'X')
    qb.add((place_qmark(qv, H), qf), mat('q_mark', F['q'], .6, .35 if ed != 'halloween' else 1.2), M)
    qb.add(([(x, y + .03, z) for x, y, z in place_qmark(ov, H, qv)], of), mat('q_outline', F['qLine'], .8), M)
    qb.finish('question_mark', root)
    return [(root, os.path.join(ASSETS, *edpath(ed), 'tiles', 'tile_fog.glb'))]


# ---------------------------------------------------------------- Turm-Porträt-Sockel
def build_portrait(ed):
    root = empty('portrait_socket')
    mb = MB()
    top, grass = mat('grass_top', '#93c262'), mat('grass', '#7fb256')
    stone, joint = mat('stone', '#a39a85', .95), mat('stone_joint', '#5c5649', .95)
    Rs = .42
    inner = hexring(Rs * .86, 0.0, 2)
    mb.add((inner + [(0, 0, 0)], [(i, (i + 1) % 12, 12) for i in range(12)]), top)
    rim = hexring(Rs, -.012, 2)
    lip = hexring(Rs * 1.025, -.02, 2)
    lip2 = hexring(Rs * 1.025, -.05, 2)
    under = hexring(Rs * .975, -.058, 2)
    mb.add(loft([under, lip2, lip, rim, inner], False, False), grass)
    h = .35 * 2 * Rs
    st_top = hexring(Rs * .975, -.058, 2)
    st_bot = hexring(Rs * .975, -h + .02, 2)
    st_b2 = hexring(Rs * .93, -h, 2)
    mb.add(loft([st_b2, st_bot, st_top], True, False), stone)
    # Fugen: waagerecht ringsum, senkrecht versetzt
    zmid = (-.058 - h) / 2
    corners = hexring(Rs * .978, 0, 1)
    for e in range(6):
        a, b = Vector(corners[e][:2]), Vector(corners[(e + 1) % 6][:2])
        nrm = Vector((-(b - a).y, (b - a).x)).normalized()
        if nrm.dot((a + b) / 2) < 0:
            nrm = -nrm
        o = nrm * .004
        p, q = a + o, b + o
        mb.add(([(p.x, p.y, zmid - .005), (q.x, q.y, zmid - .005), (q.x, q.y, zmid + .005), (p.x, p.y, zmid + .005)], [(0, 1, 2, 3)]), joint)
        for t, z0, z1 in ((.33, -.058, zmid), (.67, -.058, zmid), (.17, zmid, -h + .02), (.5, zmid, -h + .02), (.83, zmid, -h + .02)):
            c = a.lerp(b, t) + o
            d = (b - a).normalized() * .005
            mb.add(([(c.x - d.x, c.y - d.y, z0), (c.x + d.x, c.y + d.y, z0), (c.x + d.x, c.y + d.y, z1), (c.x - d.x, c.y - d.y, z1)], [(0, 1, 2, 3)]), joint)
    mb.finish('socket', root)
    # Kamera: 50 mm, 30° Neigung, Ecke zur Kamera (spitzes Hex, Ecke bei -Y), Turmfuß in der Bildmitte
    cam_data = bpy.data.cameras.new('portrait_camera')
    cam_data.lens, cam_data.sensor_width = 50, 36
    cam = bpy.data.objects.new('portrait_camera', cam_data)
    bpy.context.scene.collection.objects.link(cam)
    target = Vector((0, 0, .24))
    d = 2.2
    cam.location = target + Vector((0, -math.cos(math.radians(30)), math.sin(math.radians(30)))) * d
    cam.rotation_euler = (target - cam.location).to_track_quat('-Z', 'Y').to_euler()
    cam.parent = root
    lights = []
    for nm, colr, strength, direction in (('portrait_key', '#fff1d6', 3.2, (1.0, -1.25, 1.5)), ('portrait_rim', '#a9c98f', 1.6, (-1.1, 1.3, .9))):
        ld = bpy.data.lights.new(nm, 'SUN')
        ld.color = col(colr)
        ld.energy = strength
        ld.angle = math.radians(8)
        lo = bpy.data.objects.new(nm, ld)
        bpy.context.scene.collection.objects.link(lo)
        dv = Vector(direction).normalized()
        lo.location = dv * 3
        lo.rotation_euler = (-dv).to_track_quat('-Z', 'Y').to_euler()
        lo.parent = root
        lights.append(lo)
    sc = bpy.context.scene
    sc.camera = cam
    sc.render.resolution_x = sc.render.resolution_y = 512
    sc.render.film_transparent = True
    return [(root, os.path.join(ASSETS, *edpath(ed), 'decor', 'portrait_socket.glb'))]


# ---------------------------------------------------------------- Export, Szene, Vorschau
def edpath(ed):
    return [] if ed == 'normal' else [ed]


def tree(ob):
    out = [ob]
    for c in ob.children:
        out += tree(c)
    return out


def export(root, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.object.select_all(action='DESELECT')
    for o in tree(root):
        o.select_set(True)
    bpy.context.view_layer.objects.active = root
    kw = dict(filepath=path, export_format='GLB', use_selection=True, export_yup=True, export_apply=True, export_extras=False)
    has_cam = any(o.type in ('CAMERA', 'LIGHT') for o in tree(root))
    kw['export_cameras'] = has_cam
    kw['export_lights'] = has_cam
    bpy.ops.export_scene.gltf(**kw)


def stats(root):
    tris = sum(tri_count(o) for o in tree(root))
    mats = set()
    for o in tree(root):
        if o.type == 'MESH':
            mats |= {m.name for m in o.data.materials if m}
    return tris, sorted(mats)


def stage(made, spacing):
    """Modelle nach dem Export nebeneinander legen, Licht wie im Menü: warm von vorne rechts, kühles Gegenlicht."""
    cols = max(1, math.ceil(math.sqrt(len(made) * 1.8)))
    for i, (root, _) in enumerate(made):
        if len(made) > 1:  # Einzelmodelle (Nebelfeld, Porträt-Sockel) bleiben im Ursprung
            root.location = ((i % cols) * spacing - (cols - 1) * spacing / 2, (i // cols) * spacing, 0)
    sc = bpy.context.scene
    if not any(o.type == 'LIGHT' and o.parent is None for o in sc.objects):
        for nm, colr, e, d in (('key_warm', '#fff1d0', 3.0, (6, -8, 12)), ('rim_cool', '#9fd0ff', 1.0, (-8, 10, 6))):
            ld = bpy.data.lights.new(nm, 'SUN')
            ld.color, ld.energy = col(colr), e
            lo = bpy.data.objects.new(nm, ld)
            sc.collection.objects.link(lo)
            dv = Vector(d).normalized()
            lo.location = dv * 10
            lo.rotation_euler = (-dv).to_track_quat('-Z', 'Y').to_euler()
    w = sc.world or bpy.data.worlds.new('World')
    sc.world = w
    try:
        w.use_nodes = True
    except Exception:
        pass
    bg = w.node_tree.nodes.get('Background')
    if bg:
        bg.inputs['Color'].default_value = (*col('#1a2d24'), 1)
        bg.inputs['Strength'].default_value = 1.2


def preview(made, path, spacing):
    sc = bpy.context.scene
    xs = [r.location.x for r, _ in made]
    ys = [r.location.y for r, _ in made]
    target = Vector(((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, .15))
    cd = bpy.data.cameras.new('preview_cam')
    cd.type = 'ORTHO'
    cd.ortho_scale = max(max(xs) - min(xs), (max(ys) - min(ys)) * 1.8) + spacing * 1.2
    cam = bpy.data.objects.new('preview_cam', cd)
    sc.collection.objects.link(cam)
    dirv = Vector((0, -math.cos(math.radians(36)), math.sin(math.radians(36))))
    cam.location = target + dirv * 30
    cam.rotation_euler = (-dirv).to_track_quat('-Z', 'Y').to_euler()
    old_cam = sc.camera
    sc.camera = cam
    rx, ry = sc.render.resolution_x, sc.render.resolution_y
    sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = 1600, 1000, 100
    film = sc.render.film_transparent
    sc.render.film_transparent = False
    for eng in ('BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT', 'BLENDER_WORKBENCH'):
        try:
            sc.render.engine = eng
            break
        except Exception:
            continue
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)
    sc.camera = old_cam
    sc.render.resolution_x, sc.render.resolution_y = rx, ry
    sc.render.film_transparent = film
    bpy.data.objects.remove(cam)


GROUPS = {'decor': (build_decor, 1.0), 'tiles': (build_tiles, 2.6), 'sockets': (build_sockets, 9.0), 'fog': (build_fog, 2.6), 'portrait': (build_portrait, 1.5)}
WATER_IMG = None


def main():
    global WATER_IMG
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    eds = ['normal', 'sakura', 'halloween']
    if '--editions' in argv:
        eds = argv[argv.index('--editions') + 1].split(',')
    groups = [a for a in argv if a in GROUPS] or list(GROUPS)
    do_preview = '--preview' in argv
    preview_dir = None
    if '--preview-dir' in argv:
        preview_dir = argv[argv.index('--preview-dir') + 1]
    report = {}
    for g in groups:
        for ed in eds:
            if g == 'decor' and ed != 'normal' and not DECOR_EDITIONS.get(ed):
                continue
            if g == 'portrait' and ed != 'normal':
                continue
            bpy.ops.wm.read_factory_settings(use_empty=True)
            MATS.clear()
            WATER_IMG = water_image(ed) if g in ('decor', 'tiles') else None
            build, spacing = GROUPS[g]
            made = build(ed)
            for root, path in made:
                root.location = (0, 0, 0)
                export(root, path)
                tris, mats = stats(root)
                report[os.path.relpath(path, ASSETS).replace('\\', '/')] = {'tris': tris, 'materials': len(mats), 'names': mats}
            stage(made, spacing)
            if WATER_IMG:
                WATER_IMG.pack()
            blend = os.path.join(HERE, f'{g}_{ed}.blend')
            bpy.ops.wm.save_as_mainfile(filepath=blend, compress=True)
            if do_preview and preview_dir:
                preview(made, os.path.join(preview_dir, f'{g}_{ed}.png'), spacing)
    print('REPORT' + json.dumps(report))


main()
