**Read through the following points before jumping into examples:**<br/>
**NOTES:**
* Provide **dataSource** callback if the data can be provided as a synchronous source
* Explicitly provide **async** in field-options to make the field to always fetch the data
* Provide **ds** in form-schema's options to pass asynchronous datasource.
  * Third argument to the **getDataSource** method is a map having values of fields mentioned in dependencies key. Values will be taken from the fields directly, so check their type before using it.
  * if **getDataSource** is not found in options, **url** will be used if available. Dependencies will be automatically appended as query params to the provided url
    * when passing url for loading data directly, it is required to provide **connector** or **context** object, if not provided an exception will be thrown when data is fetched
* Currently dataSource only expects a callback which returns the data synchronously. Though it is an Alpaca's way to configure datasource, it is not supported with dctmwcombo field. Use ds to build data asynchronously

```
let formSchema = {
  schema:{/*standard alpaca control schema*/}
  options:{
    field_id:{
      isEditable: boolean,
      async: boolean,
      ds:{
        getDataSource: ()=>{ 
          /*A callback to build the data. This has to return a jquery promise and it should resolve with the datasource*/
          return $.Deferred().resolve([]).promise();
          },
        url: '',  /*If getDataSource is not available, this will be used*/
        dependencies: [], /*arr of field ids on which this field depends*/
      }

    }
  }
}
```

**Combo Field Schema** <br/>
**Example Schema 1**
```js
let formSchema = {
      schema: {
        properties: {
          user_state: {
            title: 'State', type: 'number', enum: [0, 1, 2, 3]
          },
          field1: { title: 'Status', type: 'string' },
          field2: { title: 'Users', type: 'string' }
        }
      },
      options: {
        user_state: {
          type: 'select', multiple: false, removeDefaultNone: true,
          dataSource: (cb) => {
            cb([
              { text: 'Active', value: 0 },
              { text: 'Inactive', value: 1 },
              { text: 'Locked', value: 2 },
              { text: 'Locked and Inactive', value: 3 }
              ]);
          },
        },
        fields: {
          field1: {
            type: 'dctmwcombo',
            dataSource: (cb) => {
              cb([
              { text: 'Draft', value: 0 },
              { text: 'Inactive', value: 1 },
              { text: 'Locked', value: 2 },
              { text: 'Locked and Inactive', value: 3 }
              ]);
            },
          },
          field2: {
            type: 'dctmwcombo',
            ds: {
              getDataSource: () => {
                let deferred = $.Deferred(),
                  mockData = [
                    { text: 'Administrator', value: 0 },
                    { text: 'Robert', value: 1 },
                    { text: 'Bruce', value: 2 }
                  ];
                setTimeout(() => deferred.resolve(mockData), 5000);
                return deferred.promise();
              }
            }
          }
        }
      },
      data: {
        field1: null,
        field2: null
      }
    }
```
**Example Schema 2**
configuring endpoint url directly as the ds source, and configuring dependecies to field-controls
```js
let formSchema = {
    schema: {
        id: 'sample_form_2', //form-id is mandatory when using field dependencies
        properties: {
            repo: { type: 'string', title: 'Repositories' },
            dependentRepo: { type: 'string', title: 'Dependent repository field' }
        }
    },
    options: {
        fields: {
            repo: {
                type: 'dctmwcombo',
                isEditable: true, // <<-- allows adding new values if it is not part of the dropdown values
                ds: {
                    url: '/admin-console/repositories?inline=true',
                    dsTransformer: (ds) => {
                        return ds.entries.map(item => {
                            let content = item.content;
                            return { value: content.id, text: content.description };
                        });
                    }
                }
            },
            dependentRepo: {
                type: 'dctmwcombo',
                dependencies: ['repo'], // <<--- Field dependencies
                ds: {
                    getDataSource: (_attr, field, depAttrMap) => { // <<-- depAttrMap carries the dependent field values allowing for a custom data-fetch logic
                        let deferred = $.Deferred(),
                            suffix = depAttrMap['repo'].length ? '_>>_' + depAttrMap['repo'].join('-') : '',
                            mockData = ['Administrator', 'Robert', 'Bruce'].map(value =>  ({ text: value + suffix, value }));
                        setTimeout(() => deferred.resolve(mockData), 5000);
                        return deferred.promise();
                    },
                    dsTransformer: (ds) => {
                        return ds.entries.map(item => {
                            let content = item.content;
                            return { value: content.id, text: content.description };
                        });
                    }
                }
            }
        }
    },
    data: {
        repo: [],
        repo2: []
    }
};

```