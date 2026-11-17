# menu select group
Menu item view renders the menu in a linear list.
MenuSelectGroupView is a CollectionView where the interface expect a "collection" as shown in the 
below example

```js
const collection = Backbone.Collection([
            {
              id: 'standardView',
              classname: 'csui-standard-view csui-search-view',
              displayName: lang.settingLabels.standard,
              checked: selectedItem === 'StandardView'
            },
            {
              id: 'tabularView',
              classname: 'csui-tabular-view csui-search-view',
              displayName: lang.settingLabels.list,
              checked: selectedItem === 'TabularView'
            },
            {
              id: 'allColumnsView',
              classname: 'csui-all-columns-view csui-search-view',
              displayName: lang.settingLabels.pinnedColumns,
              checked: selectedItem === 'AllColumnsView'
            },
            {
              overrideChildElm: 'otc-menudivider' // overrideChildElm this at collection level
            },
            {
            id: 'selectedColumnsContainer',
            displayName: lang.columnSettingsTitle,
            showNextCard: true,
            overrideChildElm: 'otc-menuitem' // another example of overrideChildElm
          }
        ]);
        this.sortMenuSelectGroupView = new MenuSelectGroupView({
                collection: collection, // the above mentioned collection
                childElm: 'otc-menuradio' // by default it will be otc-menuitem
                parentElm: 'otc-submenu' // by default it will be otc-menugroup
        });
this.listenTo(this.sortMenuSelectGroupView, 'change:selection', this._sortSearchResults);
this.sortMenuSelectGroupView.render();
```
if any individual update in child element use "overrideChildElm" attribute
example of the collection consumer can pass 


It return "change:selection" event listenTo below is the code sample where the parent can listen to this event and perform business logic
```js
this.listenTo(this.sortMenuSelectGroupView, 'change:selection', this._sortSearchResults);
```
