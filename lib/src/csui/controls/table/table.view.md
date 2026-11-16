# TableView

Shows a table with child nodes given via a collection.


## Properties


### columns

contains the column definitions containing the values from the server and merged with customization settings.

The visibility is computed, depending on the two flags of the column models 'is_default_column' and 'customization_hidden'.


|is_default_column|customization_hidden|effective visibility|
|---|---|---|
|unset|unset|visible|
|unset|false|visible|
|unset|true|hidden|
|false|unset|hidden|
|false|false|visible|
|false|true|hidden|
|true|unset|visible|
|true|false|visible|
|true|true|hidden|

As a precondition of the visibility a column must have type, definitions_order, registered cellview appropriately.
