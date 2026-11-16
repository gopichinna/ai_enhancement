define([
    'nuc/lib/underscore',
    'd2/sdk/controls/table/cells/cell.registry',
    'd2/sdk/controls/table/cells/templated.cell.view',
    'hbs!<%= namespace %>/table/cell/modified.by/impl/modified.by',
    'css!<%= namespace %>/table/cell/modified.by/impl/modified.by'
], function(_, CellRegistry, TemplatedCellView, template){
    'use strict';

    var ModifiedByCellView = TemplatedCellView.extend({
        template: template,
        /*
        * "getValueText" function must return the text value, which will be used by inline table filter.
        */
        getValueText: function () {
            return this.model.get("modify_user_id");
        },
        /*
        * "renderValue" function need to generate custom cell html element and append the same to table cell wrapper.
        */
        renderValue: function () {
            var modifiedBy = this.getValueText(),
                tmplData = {
                    name: modifiedBy,
                },
                html = '';
            if (!_.isEmpty(tmplData.name)) {
                tmplData.name = '' + tmplData.name;
                tmplData.initials= tmplData.name.charAt(0).toUpperCase();
                tmplData.initialColor = this.getInitialColor(tmplData.initials);
                /*
                 * Using handle bar template generate custom html content
                 */
                html = this.template(tmplData);
            }

            /*
             * Generated custom html content replaced in table cell view wrapper element.
             */
            this.$el.html(html);
        },
        getInitialColor:function(initials){
            var config = {
                colors: [ "#414979", "#2e3d98", "#4f3690", "#e00051", "#006353", "#007599", "#147bbc", "#a0006b", "#ba004C" ]
            };
            var charIndex = 0, colourIndex = 0, initialsLen = initials.length;
            for (var i = 0; i < initialsLen; i++) {
                charIndex += initials.charCodeAt(i);
            }
            colourIndex = parseInt(charIndex.toString().split("").pop());
            colourIndex = colourIndex === 9 ? colourIndex - 1 : colourIndex;
            return config.colors[colourIndex];
        }
    },{
        /*
         * "columnClassName" attribute will help to set custom class for custom table cell element.
         */
        columnClassName: "d2-table-cell-modified-by"
    });

    /*
     * Registering the custom table cell view for 'modify_user_id' column.
     * If some other column need to reuse the custom cell view, then same custom cell view can be registered with different columns.
     * e.g.
     *  CellRegistry.registerByColumnKey('custom_column_1', ModifiedByCellView);
     *  CellRegistry.registerByColumnKey('custom_column_2', ModifiedByCellView);
     */
    CellRegistry.registerByColumnKey('modify_user_id', ModifiedByCellView);
    return ModifiedByCellView;
});