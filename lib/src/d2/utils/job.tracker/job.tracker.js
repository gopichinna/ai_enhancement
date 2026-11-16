/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "nuc/lib/backbone", "nuc/models/mixins/rules.matching/rules.matching.mixin", "d2/utils/job.tracker/job.tracker.model.rules", "d2/utils/job.tracker/job.tracker.storage" ], function(require, $, _, Marionette, Backbone, RulesMatchingMixin, JobTrackerRules, JobTrackerStorage) {
  "use strict";
  var config = _.extend({}), stageInterval = 2e3, jobTrackerInstance;
  var JobTracker = Marionette.Object.extend({
    constructor: function Session(options) {
      options = options || {};
      this.options = options;
      this.init();
    },
    init: function() {
      var trackerList = JobTrackerStorage.getAllSessionStoreTrackers();
      var self = this;
      _.each(trackerList, function(value) {
        var trackerModel = self.getModel(self.options, JSON.parse(value));
        self.startLoader(trackerModel);
      });
    },
    addJob: function(options, attrs) {
      var trackerModel = this.getModel(options, attrs);
      JobTrackerStorage.saveSessionStoreTrackers(trackerModel.get("id"), JSON.stringify(trackerModel));
      this.startLoader(trackerModel);
    },
    getModel: function(options, attrs) {
      var rulesMatcher = RulesMatchingMixin.mixin({}), ruleOutput = _.find(JobTrackerRules, function(rule) {
        return rulesMatcher.matchRules(attrs, rule);
      });
      return new ruleOutput.handlerClass(attrs, options);
    },
    startLoader: function(jobModel) {
      this._checkStaus({}, jobModel);
      require([ "d2/utils/job.tracker/tracker.progress.panel.view", "smart/controls/progresspanel/progresspanel" ], function(TrackerProgressPanelView, ProgressPanel) {
        var collection = new Backbone.Collection();
        collection.add(jobModel);
        var optns = {
          ProgressPanelview: TrackerProgressPanelView,
          configOptions: config,
          collection: collection,
          enableCancel: true,
          enableMinimiseButton: true,
          actionType: jobModel.actionType(),
          jobModel: jobModel,
          allowMultipleInstances: true
        };
        ProgressPanel.showProgressPanel(collection, optns);
      });
    },
    _checkStaus: function(status, jobModel, deferred) {
      deferred = deferred || $.Deferred();
      var self = this, promise = deferred.promise(), xhr = jobModel.fetch();
      xhr.done(function() {
        jobModel.stageCheckTimeout = setTimeout(function() {
          clearTimeout(jobModel.stageCheckTimeout);
          jobModel.stageCheckTimeout = undefined;
          if (jobModel.getState() !== "resolved" && jobModel.getState() !== "aborted") {
            self._checkStaus(status, jobModel, deferred);
          } else {
            if (jobModel.getState() === "resolved") {
              jobModel.trigger("finished");
            }
            JobTrackerStorage.removeSessionStoreTrackers(jobModel.get("id"));
          }
        }, stageInterval);
      });
      promise.abort = xhr.abort;
      return promise;
    },
    fetchJobList: function() {
      var trackerList = JobTrackerStorage.getAllSessionStoreTrackers();
      var self = this;
      var returnList = [];
      _.each(trackerList, function(value) {
        var trackerModel = self.getModel(self.options, JSON.parse(value));
        returnList.push(trackerModel);
      });
      return returnList;
    }
  });
  return {
    get: function(options) {
      if (!jobTrackerInstance) {
        jobTrackerInstance = new JobTracker(options);
      }
      return jobTrackerInstance;
    }
  };
});