
# Branding - SmartView 

Admin/business administrator can customize the header of the application for all of the users whoever have sufficient permissions, admin can re brand the header of the Welcome or Home page.

Admin can customize the following elements that are visible on the header of the Home page:

* `Logo` - We can config application logo by upload the image.
* `Background color` - We can set the background color by using color picker.
* `Breadcrumb text & home icon color` - We can set the breadcrumb text & home button colors by using color picker.
* `Header icons` - As well we can config header icons via icons themes.

## Advantages

Advantages of this feature user can add their own branding like logo, colors and header icons without maintaining override css.


## Reset
Reset will rollback the customizations done via editor.

Case 1 : When there are no overides.css
Navigation header will be reset to default theme.

Case 2 : When there are overides.css
Navigation header will be reset to overides.css theme.

## Save
Function to save the selected value into the backend.

## Cancel
Function to cancel selected theme, it will fall back to the existing theme.

## REST API details

### `POST`
On saving/updating of user customization we are storing these user personalization in branding api
* `/api/v2/server/settings/branding`


### `GET`
Use the Get call for getting the details from the branding api
* `/api/v2/server/settings/branding`

## Extend this feature in other module
Extend this feature by using seperate mixin for respective module
Refer mixin <<<update.supportasset.branding.config.mixin.js>>> here for more details

## Customer logo upload
We are uploading logo in support asset volume but the other modules have the feasibility to upload in different location or in DB using different rest API with can be done using respective mixin

## Data Communication
We have separate factory <<<branding.config.factory>>>

## More items config can be added by collection(Accordians)
Extension points from extension.json

## Examples

```js
csui-extensions.js
"csui/perspective.manage/settings.panel/setting.items": {
    "extensions": {
      "csui": [
        "csui/perspective.manage/settings.panel/settings/extraAccordions"
      ]
    }
  }

extraAccordions.js
  define(['csui/lib/underscore', 'csui/lib/backbone',
'csui/perspective.manage/settings.panel/settings/branding.form',
'csui/perspective.manage/settings.panel/settings/breadcrumb.form',
], function (_, Backbone, brandingForm, breadcrumbForm) {

  return [
    {
        sequence: 40,
        contentView: brandingForm
      },
      {
        sequence: 50,
        contentView: breadcrumbForm
      },
   ];

});


```

## Accessibility
Some general Acceptance Criteria for branding regarding Accessibility 

1 keyboard navigation
2 HTML validation
3 Contrast ratio / Alternate text
4 Min 200% zoom support
5 Aria/Screen Reader support

## Device/Browser Supported
Listed supported latest browsers below.

1 Browser
    Firefox
    Chrome
    Edge Chromium
    Safari (MacOS Only)
