Please read through the notes section of [dctmwcombo](./alpdctmwcombo.md) those points also applies to dctmwlist field as well <br/>

Sample Form-Schema having dctmwlist field
```js
let formSchema =  {
      schema: {
        properties: {
          user_state: {
            title: 'State',
            type: 'number',
            enum: [0, 1, 2, 3]
          },
          field1: {
            title: 'Status',
            type: 'string'
          },
          field2: {
            title: 'Posts',
            type: 'string'
          }
        }
      },
      options: {
        user_state: {
          type: 'select',
          dataSource: (cb) => {
            cb([{ text: 'Active', value: 0 }, { text: 'Inactive', value: 1 }, { text: 'Locked', value: 2 }, { text: 'Locked and Inactive', value: 3 }]);
          },
          multiple: false,
          removeDefaultNone: true
        },
        fields: {
          field1: {
            type: 'dctmwlist',
            dataSource: (cb) => {
              cb([{ text: 'Draft', value: 0 },
              { text: 'Inactive', value: 1 },
              { text: 'Locked', value: 2 },
              { text: 'Locked and Inactive', value: 3 }
              ]);
            },
          },
          field2: {
            type: 'dctmwlist',
            async: true,
            ds: {
              getDataSource: () => {
                let deferred = $.Deferred();
                fetch('https://jsonplaceholder.typicode.com/posts')
                  .then(response => {
                    response.json().then(data => {
                      deferred.resolve(data.map(item => ({ text: item.title, value: item.id })));
                    });
                  });
                return deferred.promise();
              }
            }
          }
        }
      },
      data: {
        field1: null,
        field2: ['Invalid']
      }
    }
    ```