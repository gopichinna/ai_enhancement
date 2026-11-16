# NodePicker

Shows Smart Control's node picker by having it's own prototypes.
For more information about node picker, please host local SmartControl's storybook and
access http://<<host>>:<<port>>/?path=/story/smart-controls-node-picker-stories--default

As SmartControl's target picker expects a boolean to show node indicators for each item or not.
In order to obtain this flag, "csui/dialogs/node.picker/node.picker" provided an extension point
to it's dependent-modules/leading-applications, such that for which actions it can be enabled or
not they can decide via this extension point.


### Examples, from any model or leading application, need to provide the following extension in
the respective module extension file. For example, contentsharing module wants to enable node
indicators for "copy", "move", "collect" action types, then in contentsharing-extensions.json
should have the following entry.

```
...
...
"csui/dialogs/node.picker/node.picker": {
    "extensions": {
      "contentsharing": {
        "includes": ["copy", "move", "collect"]
      }
    }
  },
...
...
```

#### Extension parameters

includes
: Array of actions/command-names for which target picker integrates node indicators for each item.

excludes
: Array of actions/command-names for which target picker skips node indicators. Business use case
 for this option is, if any customer don't want node indicators for any specific action type
 which is being already included by any existing module, then this option still allows them to
 mask such unwanted action types. For example, as given in the above example, contentsharing
 module enabled node indicators for three actions, and a specific customer don't want for
 "collect" command, in this case he can provide the following entry from this custom module.

```
...
...
"csui/dialogs/node.picker/node.picker": {
    "extensions": {
      "contentsharing": {
        "excludes": ["collect"]
      }
    }
  },
...
...
```

always
: Boolean, by default false. If any module/leading-application/customer wants to enable node
indicator always they can send this option as true. Event "always" value is true, it respects
"excludes" and omit node indicators for those "excludes".
