# SearchResultsView

Shows full-text search results with additional functionality to load batches
of results on demand if there are a lot of them, or change sorting.

A control setting the search query is expected to be placed on the page,
otherwise the search results would have no query to use.

### Example

```javascript
var queryRegion = new Marionette.Region({el: '#query'}),
    resultsRegion = new Marionette.Region({el: '#results'}),
    pageContext = new PageContext(),
    searchBoxView = new SearchBoxView({context: pageContext}),
    searchResultsView = new SearchResultsView({context: pageContext});

queryRegion.show(searchBoxView);
resultsRegion.show(searchResultsView);
```

To extend the language bundle for pagination:
 1. Create module specific pagination file like:
     <module name>/localization/search/nls/lang:
        EmailLinkSubject: 'I want to share the following links with you',
        EmailLinkDesktop: "Link for Desktop and Android",
        EmailAppleLinkFormat: "Link for iOS Mobile"

 2. Add lang file in their bundles file:

     <module name>/bundles/<module>-all:
        ...,
        '<module name>/localization/search/nls/lang'

 3. Map it to csui pagination public language bundle in the config file:

     /app:
         require.config({
           map: {
             '*': {
                'csui/widgets/search.results/nls/lang': '<module name>/localization/search/nls/lang'
             }
           }
         });

To extend search results metadata override server.adator.mixin and search.metadata.mixin of search
.metadata.model (csui/models/widget/search.results/search.metadata).

#### Parameters:
* `config.enableBreadcrumb` - *Boolean* flag to hide location breadcrumb within searchResultsView. This affects  all instances.
Default: true.

* `config.enableSearchSettings` - *Boolean* flag to hide search settings button. This affects all instances.
Default: true.

* `options.enableSearchSettings` - *Boolean* flag to hide search settings button. This can be set in the constructor options and controls the single instance only, winning over the global setting.
Default: true.

* `config.enablePinnedColumns` - *Boolean* flag to enable pinned columns view. This affects all instances.
Default: false

* `config.enableSaveSearchTools` - *Boolean* flag to hide save search tools(save/save as buttons). This affects all instances.
Default: true.

* `config.displayCount` - *string* display count will be showed for admin users irrespective of Dispaly counts setting, where as for non admin users display count will be displayed as per display count settings. 
Default: 'Always'.
Supported Values are: Always, Never, >1, >2, >3 >4, >5, >10, >25,>50,>100. Here '> num' means minimum display count / after which display count will be showed.

* `options.enableSaveSearchTools` - *Boolean* flag to hide save search tools(save/save as buttons). This can be set in the constructor options.
Default: true.

* `options.basicSearchResultsView` - *Boolean* flag when set to true, sets feature flags related to all functionalities to false. This can be set in the constructor options. Individual feature flags when required, can be sent in constructor options along with basicSearchResultsView flag to enable them.
Default: false.

* `initialLoadMessage` - *String* value in case a initial load text needs to be displayed before a search is triggered on search results page. This needs to be passed when the search results view is created and passed to the constructor options.
Default: "Search to find"

### Newer developments:
* Added new feature in the search results i.e. Tabular view of search results.
All toolbar items configured in the otherToolbar will be shown in Header toolbar for both standard and tabular view.
All toolbar items configured in the inlineToolbar will be shown in Inline toolbar for both standard and tabular view.

* #### Pinned columns view:
  Added new feature in the search results i.e., Pinned columns view of search results. To enable this feature `config.enablePinnedColumns` has to be set to true.
  All the views are moved to search settings dropdown.
  When user is in pinned column view:
  1. Summary/description setting is not displayed.
  2. Description and summary columns are displayed based on column configuaration in classic view.
  3. Description and summary columns can be added/removed from column settings.
  4. User will be able to resize column width. These changes are user and browser specific.