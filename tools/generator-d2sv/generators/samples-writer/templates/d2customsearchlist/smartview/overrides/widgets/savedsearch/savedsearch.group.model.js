define([
    'nuc/lib/underscore',
    'nuc/lib/jquery',
    'nuc/lib/backbone',
    'd2/widgets/savedsearch/savedsearch.groups.model',
    'd2/utils/constants',
    'dctmw/utils/utils',
    'i18n!d2/widgets/savedsearch/impl/nls/lang'
], function (_, $, BackBone, SavedSearchGroupModel, Constants, utils, lang) {
    'use strict';

    function _createMergedResponse(savedsearchCollection) {

        var groupsMap = {};
        var results = [];
        var ungroupedPublicSrch ;

        savedsearchCollection.map(function (ss) {
            var tabid = ss.get('tab_id');

            //This is added to flat the list fo public search for the tiles
            /*if(ss.get("search-category")==='public_search'){
              tabid=0;
            }*/


            if (!groupsMap[tabid]) {
                var group = {};
                group['tab_id'] = tabid;
                group.name = (tabid !== -1)?tabid : ss.get('name');
                group.tooltip = ss.get('grouptooltip');
                group.savedsearch = [];
                group.savedsearch.push(ss);
                results.push(group);
                groupsMap[tabid] = group.savedsearch;
                if (tabid === 0){
                    ungroupedPublicSrch = group;
                }
            } else {
                groupsMap[tabid].push(ss);
            }
        });
        var finalresults = results.filter(function(group){
            return group['tab_id'] === -1 || group['tab_id'] === lang.privatesearch;
        });

        var folderResults = results.filter(function(group){
            return group['tab_id'] !== 0 && group['tab_id'] !== -1 ;
        });

        folderResults = _.sortBy(folderResults, function(folder) {
            return folder.name.toLowerCase();
        });

        var finalResults = finalresults.concat(folderResults);

        if (ungroupedPublicSrch){
            finalResults.push(ungroupedPublicSrch);
        }
        return finalResults;
    }
    SavedSearchGroupModel.prototype.sync= function (method, model, options) {
        if (method === 'read') {
            var savedsearchCollection = this.savedsearch;
            var deferred = $.Deferred();
            options.parse = false;
            var me = this;
            this.trigger('request', model, {}, options);
            savedsearchCollection.fetch({reload: true})
                .then(function (/*response*/) {
                    if (!utils.isMobile()) {
                        var qrCodeModelsList = savedsearchCollection.filter(function (model) {
                            var queryFormType = model.get(Constants.QueryFormTypes.QUERY_FORM_TYPE),
                                qrCodeQueryFormType = Constants.QueryFormTypes.QR_CODE;
                            return (queryFormType && queryFormType.toLowerCase() === qrCodeQueryFormType);
                        });
                        if (qrCodeModelsList.length > 0) {
                            savedsearchCollection.remove(qrCodeModelsList, {silent: true});
                        }
                    }

                    var merged = _createMergedResponse(savedsearchCollection);
                    options.success.call(options.context, merged, 'success', {});
                    deferred.resolve(merged);
                }, function (error) {
                    me.trigger('error', model, {}, options);
                    deferred.reject(error);
                });
            return deferred.promise();
        }
    };
});
