# NodePicker

Shows a dialog with a form for selecting one or multiple nodes (documents,
containers, categories or other object types).

below configuration has to be provided in csui.inlineform.schemas and the extending module to show the inlinenodepicker field 

### configuration Example
 classification: {
            type: 'nodePicker',
            required: true,   
            namePlaceholder: 'Select classification',
            parameters: {
              dialogTitle : 'Select classification',
              select_types: [196,199],
              start_location: 'classifications.volume',
              startLocations: ["classifications/dialogs/node.picker/start.locations/classifications.volume"]
            }
          }
### type
type has to be provided as 'nodePicker' while configuring a nodepicker field           

### required
required is optional field and can  be provided as boolean value, It can be true or false.  while configuring a nodepicker field   required is to maintain required state of field to help in validation

### namePlaceholder
namePlaceholder is to show place holder in nodepicker , Value to be proided in string

### parameters
it is an object containing parameters specific to nodepicker dialog to be opened

 select_types
: it is an array of values containing selectable types in the nodepicker


dialogTitle
: Text to show in the dialog caption (string, a general text by default)

startLocation
: Id of the start location the target browser opens (string: `current.location`,
`recent.containers`, `favorites`, `enterprise.volume`, `personal.volume`, `perspective.assets.volume`). If startLocation
is provided and valid, the target browser will start at the specified location, else it
uses the intialContainer location or next location specified in the location rules.

startLocations
:If startLocations are provided and valid, the target browser will show specified location in nodepicker dialog dropdown, else it uses the intialContainer location or next location specified in the location rules.


