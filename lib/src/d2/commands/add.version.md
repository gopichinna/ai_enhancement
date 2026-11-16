# Add Version Command

**Module: d2/commands**

Add version command enables to create new version for the document. 
Add version command is already included with D2 Bundle.

If document is not reserved, then document will be checked out before adding new version.
While checking out D2 Checkout configuration will be honored.

After D2 Checkin configuration will be honored.
Based on the configuration, dialog will be launched with add version general form and properties form.

D2 Add version command can be extended or consumed from other command for adding new version in D2.

### Examples - Get Add version command from command collection

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
            signature: 'Custom-AddVersion',
            command_key: 'Custom-AddVersion',
            name: 'Custom Add Version',
            scope: 'single',
            verb:  'Custom Add Version'
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
                        checkinFixedFile: true
                    },
                    addVersionCommand = commands.get("AddVersion");

                addVersionCommand.execute(status, options).done(dfd.resolve).fail(dfd.reject);
            });
            return dfd.promise();
        }
    });
});

```
### Examples - Extending Add Version command

```
// Extend Add Version Command
define([
  'd2/commands/add.version',
], function (AddVersionCommand) {
  return AddVersionCommand.extend({

    defaults: {
      signature: 'Custom-AddVersion',
      command_key: 'Custom-AddVersion',
      name: 'Custom Add Version',
      scope: 'single',
      verb:  'Custom Add Version'
    },
	
	enabled: function (status, options) {
      return new AddVersionCommand.prototype.enabled.apply(this, arguments);
    }

    execute: function (status, options) {
      var files = [new File([new Blob()], "image.png", {type: "image/png"})];
      options.files= files;
      options.checkinFixedFile= true;
      return new AddVersionCommand.prototype.execute.apply(this, arguments);
    }
  });
});

```

---
## AddVersionCommand.execute(status, options)

Initiate the checkin for adding new version for Documents.

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

checkinFixedFile
:  Boolean attribute to set the add version process is restricted to the passed file.

contentUploadValidator
: 
<ul>
<li>Custom validator class instance which must be extended from <b>d2/utils/validator/base.content.upload.validator</b>.</li>
<li>This validator class provides hook for executing the asynchronous code after uploading the file content to the server as part of checkin process. </li>
<li>Validator class must have <b>validateUploadedContent</b> function overridden for performing the validation. Same function must return a jQuery Promise object.
<ul>
<li>When promise is <b>resolved</b>, success toast message will be shown.
<li>When promise is <b>rejected</b>, warning message will be shown for conveying the validation failure message.
</ul>
</li>
</ul>  