/* Dialog focus belongs to the visible dialog and returns to its opener. */
(()=>{
 const dialogs=[...document.querySelectorAll('[role="dialog"]')],previous=new Map(),open=new Set();
 const visible=node=>!node.classList.contains('hidden')&&node.getAttribute('aria-modal')==='true';
 const controls=node=>[...node.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),[tabindex="0"]')].filter(el=>el.getClientRects().length);
 function sync(){
   for(const dialog of dialogs){if(visible(dialog)&&!open.has(dialog)){previous.set(dialog,document.activeElement);open.add(dialog);(controls(dialog)[0]||dialog).focus?.();}else if(!visible(dialog)&&open.delete(dialog)){const opener=previous.get(dialog);if(opener?.isConnected&&opener.getClientRects().length)opener.focus?.();previous.delete(dialog);}}
 }
 new MutationObserver(sync).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class','aria-modal']});
 document.addEventListener('keydown',event=>{if(event.key!=='Tab')return;const dialog=[...open].at(-1);if(!dialog)return;const items=controls(dialog);if(!items.length){event.preventDefault();return;}const first=items[0],last=items.at(-1);if(event.shiftKey&&(document.activeElement===first||!dialog.contains(document.activeElement))){event.preventDefault();last.focus();}else if(!event.shiftKey&&(document.activeElement===last||!dialog.contains(document.activeElement))){event.preventDefault();first.focus();}});
 sync();
})();
