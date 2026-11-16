import DialogAction from 'd2/sdk/controls/dialogs/generic/dialog.action';
import utils from '<%= namespace %>/utils/utils';

class OpenFolder extends DialogAction {
 constructor(options={}) {
   super(options);
 }

 execute(options) {
   const {formView, dialog, dialogState} = options;
   
   return formView.validateForm(true)
     .then(isValid => {
       if(isValid) {
         const formValues = formView.getFlatFormValueMap(formView.getValues());
         return dialogState.validateForm(formValues).then(formData => {
           if (formValues['folder_exists'] === true) {
             return utils
               .openFolder({id: formValues.folder_id})
               .then(()=>{
                 dialog.close();
               });
           } else {
             dialog.close(formData);
           }
         });
       } else {
         return false;
       }
     });
 }
}

const rules = [
 {and:[{equals:{"button.id": "buttonOpenFolder"}},{equals:{"formName": "OpenFolder"}}], action: OpenFolder}
];

export default rules;