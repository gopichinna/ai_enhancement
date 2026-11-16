# Widget Settings

Widget settings is a concept to provide widgets with preferences, that are persisted and available across sessions on the same device.

Reason to provide an dedicated concept instead of letting each widget store their settings to a storage it wants is: by unifying the settings, csui can provide overridability of the storage. This is required in certain customized scenarios at the customer. If a widget has to support these scenarios it is recommended to use the widget settings approach described here.


## Overview

The widget settings are provided to the widgets via a backbone collection available in the context. A widget, which needs preferences be loaded before its rendering, gets its settings by getting a widget settings model from the collection of by creating the widget settings model in the collection as needed.

Widgets identify their settings by using an id, which needs to be unique per convention. Best practice to achieve uniqueness is to start the id using the module prefix.

The widget settings collection is loaded by the perspective.context and browsing.context right in time so when the 'request' event is triggered on the context, the widget settings are already loaded and avalable. In the views, when they need widget settings to read, the view has to wait for the 'request' event. Only then it is ensured, that the settings are loaded.

The page.context and portal.context do not automatically load the widget settings before the 'requets' event on the context, as these contexts by design do not provide an asynchronous step before its fetch. If you need widget settings in a scenario with page.context or portal.context you can write a plugin, that loads the settings synchronously, if the underlying widget setting storage can synchronously read and write the data.


## Reading widget settings

In your widget you can read widget settings in a request handler called when the 'request' event on the context is triggered.
For that just get the widget settings collection from the context and get the desired widget settings model from the collection.

For example, in a widget 'mymodule/famous.widget', the code might be:

```
  require 'csui/utils/contexts/factories/widget.settings.collection.factory' as WidgetSettingsCollectionFacory;

  ...

  function getMyWidgetSettings() {
    const myWidgetSettingsId = 'mymodule/famous.widget:global';
    if (!this.myWidgetSettings || this.myWidgetSettings.get(this.myWidgetSettings.idAttribute) !== myWidgetSettingsId) {
      const widgetSettings = this.context.getCollection(WidgetSettingsCollectionFactory);
      const myWidgetSettings = widgetSettings.get(myWidgetSettingsId);
      if (myWidgetSettings || this.myWidgetSettings) {
        this.myWidgetSettings = myWidgetSettings;
        // do additional initializations/resets here to correctly reflect the change of the settings.
      }
    }
  }
```

Using 'mymodule/famous.widget:global' as id in each instance of the widget, each widget instance has the same settings. To support more specific settings depending on where the user has navigated to or in which perspective the widget is located, use a more specific name than just 'global'.


## Persisting widget settings

At any time when a setting of the widget is changed, for example in the nodes table, when the user switches the table mode, be sure to call the save method of the widget setting model.

For example:

```
  require 'csui/utils/contexts/factories/widget.settings.collection.factory' as WidgetSettingsCollectionFacory;
  require 'i18n!mymodule/famous.widget/impl/nls/lang' as lang;

  ...

  function handleSettingsOneChanged(newValue) {
    makeMyWidgetSettings.call(this);
    this.nodesTableSettings.save({ 'settingOne': newValue }).fail(() => {
      GlobalMessage.showMessage('error', lang.errorSavingSettingOne);
    });
  }

  ...

  function makeMyWidgetSettings() {
    getMyWidgetSettings.call(this);
    if (!this.myWidgetSettings) {
      const myWidgetSettingsId = 'mymodule/famous.widget:global';
      const widgetSettings = this.context.getCollection(WidgetSettingsCollectionFactory);
      const idAttribute = widgetSettings.model.prototype.idAttribute;
      this.myWidgetSettings = widgetSettings.create({ [idAttribute]: myWidgetSettingsId });
    }
  }
```

In above example 'handleSettingsOneChanged' is the request handler, called when the user has switched the setting in the UI.
You may also have a look to the nodetable.view as an example.

The standard implementation stores the settings in the local storage under 'csui/models/widget/settings'.

## Overrides

The implementation of the storage access can be customized per product line by overriding
widget.settings.collection.mixin and widget.settings.model.mixin as demonstrated in 
'test/pages/widgetsettings.customized-elliot.html' and
'src/widgets/nodestable/test/widgetsettings.customized.html'.
