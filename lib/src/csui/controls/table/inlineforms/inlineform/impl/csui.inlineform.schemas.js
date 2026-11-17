/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "i18n!csui/controls/table/inlineforms/base/impl/nls/lang" ], function(lang) {
  return [ {
    equals: {
      type: 0
    },
    form: {
      fields: {
        name: {
          type: "text",
          required: true,
          namePlaceholder: lang.NewNamePlaceholder,
          multilingual: true
        }
      }
    }
  }, {
    equals: {
      type: -1
    },
    form: {
      fields: {
        name: {
          type: "text",
          required: true,
          namePlaceholder: lang.NewNamePlaceholder,
          multilingual: true
        }
      }
    }
  }, {
    equals: {
      type: 1
    },
    form: {
      fields: {
        name: {
          type: "text",
          required: true,
          namePlaceholder: lang.ShortcutNamePlaceholder,
          multilingual: true
        }
      }
    }
  }, {
    equals: {
      type: 298
    },
    form: {
      fields: {
        name: {
          type: "text",
          required: true,
          namePlaceholder: lang.NewNamePlaceholder,
          multilingual: true
        }
      }
    }
  }, {
    equals: {
      type: 1308
    },
    form: {
      fields: {
        name: {
          type: "text",
          required: true,
          namePlaceholder: lang.NewNamePlaceholder,
          multilingual: true
        }
      }
    }
  }, {
    equals: {
      type: 136
    },
    form: {
      fields: {
        name: {
          type: "text",
          required: true,
          namePlaceholder: lang.NewNamePlaceholder,
          multilingual: true
        }
      }
    }
  }, {
    equals: {
      type: 800
    },
    form: {
      fields: {
        name: {
          type: "text",
          required: true,
          namePlaceholder: lang.NewNamePlaceholder,
          multilingual: true
        }
      }
    }
  }, {
    equals: {
      type: 140
    },
    form: {
      fields: {
        name: {
          type: "text",
          required: true,
          namePlaceholder: lang.UrlNamePlaceholder,
          multilingual: true
        },
        url: {
          type: "text",
          required: true,
          namePlaceholder: lang.UrlAddressPlaceholder,
          regex: /^[a-z0-9]+:\/\/[a-z0-9]+([\-\.]{1}[a-z0-9]+)*(\:[0-9]{1,5})?(([0-9]{1,5})?\/.*)?$/i
        }
      }
    }
  } ];
});