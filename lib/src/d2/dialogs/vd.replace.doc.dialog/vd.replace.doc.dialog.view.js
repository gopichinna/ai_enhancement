/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import {
  LayoutView
} from "nuc/lib/marionette";

import NodeModel from "nuc/models/node/node.model";

import NodeTypeIconView from "csui/controls/node-type.icon/node-type.icon.view";

import lang from "i18n!d2/dialogs/vd.replace.doc.dialog/impl/nls/lang";

import template from "hbs!d2/dialogs/vd.replace.doc.dialog/impl/vd.replace.doc.dialog";

import moment from "nuc/lib/moment";

import "css!d2/dialogs/vd.replace.doc.dialog/impl/vd.replace.doc.dialog";

import RestResources from "dctmw/utils/rest.resources";

class VdReplaceDocDialog extends LayoutView {
  vdocStructure = null;
  vdCollection = null;
  titleView = null;
  template = template;
  className() {
    return "vd-replace-doc-dialog";
  }
  ui() {
    return {
      selectedNodeIconContainer: ".vd-replace-selected--node-container .doc-icon",
      selectedNodeNameContainer: ".vd-replace-selected--node-container .doc-name",
      targetNodeIconContainer: ".vd-replace-target--node-container .doc-icon",
      targetNodeNameContainer: ".vd-replace-target--node-container .doc-name"
    };
  }
  regions() {
    return {
      selectedNodeIconContainerRgn: "@ui.selectedNodeIconContainer",
      selectedNodeNameContainerRgn: "@ui.selectedNodeNameContainer",
      targetNodeIconContainerRgn: "@ui.targetNodeIconContainer",
      targetNodeNameContainerRgn: "@ui.targetNodeNameContainer"
    };
  }
  templateHelpers() {
    let dateFormat = RestResources.getCurrentUser().get("preferences")["date_time_format"];
    let targetDocModifyDate = moment(new Date(this.options.targetNode.get("modify_date"))).format(dateFormat), srcDocModifyDate = moment(new Date(this.options.dragData.nodes[0].modify_date)).format(dateFormat);
    return {
      vdReplaceQuery: lang.vdReplaceQuery,
      sourceFileLabel: lang.SourceFile,
      destinationFileLabel: lang.DestinationFile,
      addAsAChildRadioLabel: lang.AddAsAChildRadioLabel,
      addAsAChildRadioDesc: lang.AddAsAChildRadioDesc,
      replaceFileRadioLabel: lang.ReplaceFileRadioLabel,
      replaceFileRadioDesc: lang.ReplaceFileRadioDesc,
      srcDocTitle: this.options.dragData.nodes[0].name,
      trgtDocTitle: this.options.targetNode.get("name"),
      srcDocModifyDate: srcDocModifyDate,
      targetDocModifyDate: targetDocModifyDate
    };
  }
  constructor(options) {
    super(options);
    this.options = options || {};
  }
  onRender() {
    this.showChildViews();
  }
  showChildViews() {
    let dragNode = new NodeModel(this.options.dragData.nodes[0]);
    let srcIconView = new NodeTypeIconView({
      originatingView: this.ui.selectedNodeContainer,
      node: dragNode
    });
    this.selectedNodeIconContainerRgn.show(srcIconView);
    let targetIconView = new NodeTypeIconView({
      originatingView: this.ui.targetNodeContainer,
      node: this.options.targetNode
    });
    this.targetNodeIconContainerRgn.show(targetIconView);
  }
}

export default VdReplaceDocDialog;