function getCleanCSSSelector(element) {
    function getSelectorAccuracy(selector) {
       return document.querySelectorAll(selector).length;
    }
   if(!element) {
       return;
   }

   var selector = element.tagName ? element.tagName.toLowerCase() : '';
   if(selector == '' || selector == 'html') return '';

   var tmp_selector = '';
   var accuracy = getSelectorAccuracy(selector);
   if(element.id) {
       selector = "#" + element.id.replace(/\./g, '\\.');
       accuracy = getSelectorAccuracy(selector);
       if(accuracy===1) {
           return selector;
       }
   }
   if(element.className) {
       tmp_selector = '.' + element.className.trim().replace(/ /g,".");
       if(getSelectorAccuracy(tmp_selector) < accuracy) {
           selector = tmp_selector;
           accuracy = getSelectorAccuracy(selector);
           if(accuracy===1) {
               return selector;
           }
       }
   }
   var parent = element.parentNode;
   var parent_selector = getCleanCSSSelector(parent);

   if(parent_selector) {

       // resolve sibling ambiguity
       var matching_sibling = 0;
       var matching_nodes = document.querySelectorAll(parent_selector + ' > ' + selector);
       for(var i=0; i<matching_nodes.length;i++) {
           if(matching_nodes[i].parentNode === parent) matching_sibling++;
       }
       if(matching_sibling > 1) {
           var index = 1;
           for (var sibling = element.previousElementSibling; sibling; sibling = sibling.previousElementSibling) index++;
           selector = selector + ':nth-child(' + index + ')';
       }

       // remove useless intermediary parent
       selector_array = parent_selector.split(' ');
       if(selector_array.length>1) {
           for(var i=1;i<selector_array.length;i++) {
               tmp_selector = selector_array.slice(0,i).join(' ') + ' ' + selector;
               if(getSelectorAccuracy(tmp_selector) === 1) {
                   selector = tmp_selector;
                   break;
               }
           }
       }

       // improve accuracy if still not correct
       accuracy = getSelectorAccuracy(selector);
       if(accuracy>1) {
           tmp_selector = parent_selector + " " + selector;
           if(getSelectorAccuracy(tmp_selector) === 1) {
               selector = tmp_selector;
           } else {
               selector = parent_selector + " > " + selector;
           }
       }
   }

   return selector;
}