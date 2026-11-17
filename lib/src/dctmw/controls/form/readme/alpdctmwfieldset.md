Sample fields inside fieldset
```javascript
let schema = {
      schema: {
        id: 'form_id',
        properties: {
          user: {
            type: 'boolean',
            title: 'user',
          },
          fieldset_id_1: {
            type: 'object',
            properties: {
              user_state: {
                title: 'State',
                type: 'number',
                enum: [0, 1, 2, 3]
              }
            }
          }
        }
      },
      options: {
        fields: {
          user: {
            type: 'checkbox'
          },
          fieldset_id_1: {
            type: "fieldset",
            fields: {
              user_state: {
                type: 'dctmwcombo',
                dataSource: (cb) => {
                  cb([{ text: 'Draft', value: 0 },
                  { text: 'Inactive', value: 1 },
                  { text: 'Locked', value: 2 },
                  { text: 'Locked and Inactive', value: 3 }
                  ]);
                },
              }
            }
          }
        }
      },
      data: {
        user: false,
        fieldset_id_1: {
          user_state: [1]
        }
      }
    }
```