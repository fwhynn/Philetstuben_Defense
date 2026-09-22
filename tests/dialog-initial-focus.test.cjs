const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('reward dialog focuses its heading instead of pre-highlighting the first card, retaining Tab navigation',()=>{
 let focused=null;const heading={focus(){focused=this;}},card={focus(){focused=this;},getClientRects(){return [{}];}},listeners={};
 const dialog={classList:{contains:()=>false},getAttribute:()=> 'true',querySelector:()=>heading,querySelectorAll:()=>[card],contains:el=>el===heading||el===card};
 const document={body:{},get activeElement(){return focused;},querySelectorAll:()=>[dialog],addEventListener(name,fn){listeners[name]=fn;}};
 vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../classes/dialog-focus.js'),'utf8'),{document,MutationObserver:class{observe(){}}});assert.equal(focused,heading);
 listeners.keydown({key:'Tab',shiftKey:true,preventDefault(){}});assert.equal(focused,card);
});
test('ordinary dialogs focus the container, never a default action',()=>{
 let focused=null;const button={focus(){focused=this;},getClientRects(){return [{}];}},dialog={classList:{contains:()=>false},getAttribute:()=> 'true',querySelector:()=>null,querySelectorAll:()=>[button],setAttribute(k,v){this[k]=v;},focus(){focused=this;}};
 const document={body:{},get activeElement(){return focused;},querySelectorAll:()=>[dialog],addEventListener(){}};
 vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../classes/dialog-focus.js'),'utf8'),{document,MutationObserver:class{observe(){}}});assert.equal(focused,dialog);assert.equal(dialog.tabindex,'-1');
});
