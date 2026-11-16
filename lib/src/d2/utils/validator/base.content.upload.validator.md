# BaseContentUploadValidator

**Module: d2/utils/validator/base.content.upload.validator**

<ul>
    <li>Base implementation for validating the file content after uploading the same to server.</li>
    <li>This class provides base implementation for executing the asynchronous code after uploading the file content to the server.</li>
    <li>Implementing class must override the <b>validateUploadedContent</b> function for postprocessing the content upload.</li>
    <li>The overridden function must return a jQuery promise.</li>
    <li>In the base implementation, <b>validateUploadedContent</b> function will return the promise.</li>
</ul>

## Class Methods

### BaseContentUploadValidator([options](#options))
Creates a new instance with supplied configuration.

#### options
Any custom options can be passed, which will be available in class instance.

### validateUploadedContent([uploadedContentData](#options))
Returns jQuery Promise Object.
Implementing class must have custom logic to validate the uploaded file content. Once validation is done resolve or reject the promise.

#### Sample - Custom class implementation for custom content upload validator.
````javascript
define([
    'csui/lib/backbone',
    'csui/lib/marionette',
    'd2/utils/validator/base.content.upload.validator',
],function(Backbone, Marionette, BaseContentUploadValidator) {
    var CustomContentUploadValidator = BaseContentUploadValidator.extend({
        constructor: function CustomContentUploadValidator(options) {
            BaseContentUploadValidator.prototype.constructor.apply(this, arguments);
        },
        validateUploadedContent: function (uploadedContentData) {
            var deferred = $.Deferred();
            this.customValidate(uploadedContentData).done(()=>{
                deferred.resolve()
            }).fail((error)=>{
                deferred.reject(error);
            })
            return deferred.promise();
        },
        customValidate:function(uploadedContentData){
            let file = uploadedContentData.file, // File binary which is passed as part of command options.
                r_object_id = uploadedContentData.r_object_id, // Uploaded content's r_object_id
                operation = uploadedContentData.operation, // import(or)checkin
                nodeModel = uploadedContentData.nodeModel,
                contentUploadResponse = uploadedContentData.contentUploadResponse; // Content upload API's response. 
            if(nodeModel.get('aContentType') === 'pdf'){
                return $.Deferred().resolve().promise();
            } else {
                return $.Deferred().reject('Uploaded file is not PDF.').promise();
            }
        }
    });
});
````

