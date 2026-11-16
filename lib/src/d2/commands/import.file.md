# Import File Command

**Module: d2/commands**

Import file command enables to upload a document in the Documentum. 
Import file command is already included with D2 Bundle.

Import file command honors all the D2-Configurations and Validation which is associated for importing content.
Based on the configuration, dialog will be launched with import file wizard.

D2 Import file command can be extended or consumed from other command for adding new version in D2.


### Examples - Get Import file command from command collection

```
define([
    'require',
    'nuc/lib/jquery',
    'nuc/models/nodes',
    'csui/models/command',
    'd2/utils/authenticators/session',
    'd2/widgets/widgettable/widgettable.view',
], function (require, NodeCollection, Command, Session, WidgetTableView) {
    return Command.extend({

        defaults: {
            signature: 'Custom-ImportFile',
            command_key: 'Custom-ImportFile',
            name: 'Custom Import FIle',
            scope: 'single',
            verb: 'Custom Import File'
        },

        enabled: function (status, options) {
            return new Command.prototype.enabled.apply(this, arguments);
        },

        execute: function (status, options) {
            var dfd = $.Deferred();
            //Need to load commands collection separately to avoid transitive dependency within the command
            require([
                'csui/utils/commands'
            ], function (commands) {
                //Context, Selected Nodes and originating view will be available in status object of parent command's execute function.
                var context = Session.get().getContext(),
                    nodeCollection = new NodeCollection([{
                        id: '0b0003e980000000'
                    }]),
                    originatingView = new WidgetTableView({}),
                    files = [new File([new Blob()], "image.png", {type: "image/png"})],
                    status = {
                        context: context,
                        nodes: nodeCollection,
                        originatingView: originatingView
                    },
                    options = {
                        files: files,
                        fixedFileImport: true
                    },
                    importFileCommand = commands.get("D2-ImportFile");

                importFileCommand.execute(status, options).done(dfd.resolve).fail(dfd.reject);
            });
            return dfd.promise();
        }
    });
});
```

### Examples - Extending Import file command

```
define([
  'd2/commands/import.file',
], function (ImportFileCommand) {
  return ImportFileCommand.extend({

    defaults: {
      signature: 'Custom-ImportFile',
      command_key: 'Custom-ImportFile',
      name: 'Custom Import File',
      scope: 'single',
      verb:  'Custom Import File'
    },
	
	enabled: function (status, options) {
      return new AddVersionCommand.prototype.enabled.apply(this, arguments);
    }

    execute: function (status, options) {
      var files = [new File([new Blob()], "image.png", {type: "image/png"})];
      options.files= files;
      options.fixedFileImport= true;
      return new AddVersionCommand.prototype.execute.apply(this, arguments);
    }
  });
});

```
### Examples - Setting Custom Uploaded file validator in Import command options.

```
define([
  'd2/commands/import.file',
  'custom/utils/custom.uploaded.file.validator',
], function (ImportFileCommand,CustomContentUploadValidator) {
  return ImportFileCommand.extend({

    defaults: {
      signature: 'Custom-ImportFile',
      command_key: 'Custom-ImportFile',
      name: 'Custom Import File',
      scope: 'single',
      verb:  'Custom Import File'
    },
	
	enabled: function (status, options) {
      return new AddVersionCommand.prototype.enabled.apply(this, arguments);
    }

    execute: function (status, options) {
      var files = [new File([new Blob()], "image.png", {type: "image/png"})];
      options.files= files;
      options.fixedFileImport= true;
      options.contentUploadValidator = new CustomContentUploadValidator();
      return new AddVersionCommand.prototype.execute.apply(this, arguments);
    }
  });
});

```
---
## ImportFileCommand.execute(status, options)

Initiate the Import file flow for uploading new documents.

#### Status

context
: Current application context object.

nodes
: Selected node for which add version command is executed.

originatingView
: Source marionette view where add version command is executed.

#### Options

files
:  JavaScript file object, This file content will be used while adding a new version of a document. 

fixedFileImport
:  Boolean attribute to set the import process is restricted to the passed file.

contentUploadValidator
:  
<ul>
   <li>Custom validator class instance which must be extended from <b>d2/utils/validator/base.content.upload.validator</b>.</li>
   <li>This validator class provides hook for executing the asynchronous code after uploading the file content to the server as part of content import process. </li>
   <li>Validator class must have <b>validateUploadedContent</b> function overridden for performing the validation. Same function must return a jQuery Promise object.
      <ul>
         <li>When promise is <b>resolved</b>, import process will be <b>resumed</b> for the specific object.</li>
         <li>When promise is <b>rejected</b>, import process will be <b>terminated</b> for the specific object.</li>
      </ul>
   </li>
</ul>   
   
