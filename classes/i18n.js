/* Display-only localization. IDs, saves, commands and simulation data stay unchanged. */
(function(root){
  'use strict';
  const catalog=root.HexTranslations||{de:{},en:{}};
  const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  function translator(entries){
    const keys=Object.keys(entries).sort((a,b)=>b.length-a.length);
    if(!keys.length)return s=>s;
    const pattern=new RegExp(keys.map(k=>(/^[\p{L}\p{N}]/u.test(k)?'(?<![\\p{L}\\p{N}_])':'')+escape(k)+(/[\p{L}\p{N}]$/u.test(k)?'(?![\\p{L}\\p{N}_])':'')).join('|'),'gu');
    return s=>s.replace(pattern,k=>entries[k]);
  }
  const german=translator(catalog.de),english=translator(Object.fromEntries(Object.entries(catalog.en).map(([k,v])=>[german(k),v])));
  let language='de';try{if(root.localStorage?.getItem('language')==='en')language='en';}catch{}
  const cache=new Map();
  function text(value,lang=language){
    const raw=String(value);if(!/\p{L}/u.test(raw))return raw;
    const key=lang+'\0'+raw;if(cache.has(key))return cache.get(key);
    const s=german(raw),result=lang==='en'?english(s):s;
    if(cache.size>=2048)cache.clear();cache.set(key,result);return result;
  }
  const records=new WeakMap(),attributes=['title','aria-label','placeholder','alt'];
  const ignored=node=>node.parentElement?.closest('script,style,textarea,input,[data-no-translate],[data-language-picker]');
  function translateValue(node,key,read,write){
    let map=records.get(node);if(!map){map=new Map();records.set(node,map);}
    const value=read(),previous=map.get(key),source=previous&&value===previous.output?previous.source:value;
    const normalized=source.replace(/\s+/g,' ').trim();
    const translated=text(normalized),output=source.replace(/\S[\s\S]*\S|\S/,()=>translated);
    map.set(key,{source,output});if(value!==output)write(output);
  }
  function apply(node){
    if(!node)return;
    if(node.nodeType===3){if(!ignored(node))translateValue(node,'text',()=>node.nodeValue,v=>{node.nodeValue=v;});return;}
    if(node.nodeType!==1&&node.nodeType!==9)return;
    if(node.nodeType===1){if(node.matches('script,style,textarea,input,[data-no-translate],[data-language-picker]')){
      if(node.matches('input,[data-language-picker]'))for(const key of attributes)if(node.hasAttribute(key))translateValue(node,key,()=>node.getAttribute(key),v=>node.setAttribute(key,v));
      return;
    }for(const key of attributes)if(node.hasAttribute(key))translateValue(node,key,()=>node.getAttribute(key),v=>node.setAttribute(key,v));}
    for(const child of node.childNodes||[])apply(child);
  }
  function setLanguage(next){if(!['de','en'].includes(next))return;language=next;try{root.localStorage?.setItem('language',next);}catch{}
    if(root.document){root.document.documentElement.lang=next;apply(root.document.body);root.document.querySelectorAll('[data-language-picker]').forEach(select=>select.value=next);}
    if(root.CustomEvent)root.dispatchEvent?.(new root.CustomEvent('hexlanguagechange'));
  }
  // Preserve original strings when copying translated rules into another menu.
  function sourceHTML(element){
    const clone=element.cloneNode(true);
    function restore(source,target){for(const [key,record] of records.get(source)||[]){if(key==='text')target.nodeValue=record.source;else target.setAttribute(key,record.source);}
      for(let n=0;n<source.childNodes.length;n++)restore(source.childNodes[n],target.childNodes[n]);}
    restore(element,clone);return clone.outerHTML;
  }
  function start(){const doc=root.document;if(!doc)return;setLanguage(language);
    doc.addEventListener('change',e=>{if(e.target.matches?.('[data-language-picker]'))setLanguage(e.target.value);});
    const observer=new MutationObserver(changes=>{observer.disconnect();for(const change of changes){if(change.type==='childList')for(const node of change.addedNodes)apply(node);else apply(change.target);}observe();});
    function observe(){observer.observe(doc.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attributes});}observe();
  }
  root.HexI18n={text,setLanguage,getLanguage:()=>language,apply,sourceHTML};
  if(root.document){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',start,{once:true});else start();}
  if(typeof module!=='undefined')module.exports=root.HexI18n;
})(globalThis);
