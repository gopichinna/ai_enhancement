/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'd2/utils/widget.constants'
], function(WidgetConstantsImpl){
  'use strict';

  /**
   * A few utility constants related to widgets
   *
   * @module {d2/sdk/utils/widget.constants} d2/sdk/utils/"widget.constants"
   * @name WidgetConstants
   * @extends Object
   *
   */

  return Object.freeze({
    /**
     * Tile config types.
     * @memberOf module:WidgetConstants
     * @type {Object}
     * @property {string} NONE - This tile requires a widget config
     * @property {string} WIDGET - This tile requires a widget config
     *
     */
    TileConfigTypes: WidgetConstantsImpl.TileConfigTypes,

    /**
     * OOTB D2 widget types that has an implementation within the D2 Smart View runtime
     * @memberOf module:WidgetConstants
     * @type {Object}
     * @property {string} RECENTLY_ACCESSED - RecentlyAccessedWidget
     * @property {string} CHECKOUT - CheckoutDocumentWidget
     * @property {string} DOCLIST - DoclistWidget
     * @property {string} FAVORITES - FavoritesWidget
     * @property {string} BRAVACSR - BravaCSRViewerWidget
     * @property {string} OPENURL - OpenURLWidget
     * @property {string} RELATIONS - DetailsRelationsWidget
     * @property {string} RENDITIONS - DetailsRenditionsWidget
     * @property {string} VERSIONS - DetailsVersionsWidget
     * @property {string} PROPERTIES - Properties
     * @property {string} SEARCH - SearchWidget
     * @property {string} MYSHARES - SharedDocumentWidget
     * @property {string} VDOC - VirtualDocWidget
     * @property {string} TASKS - TasksWidget
     * @property {string} WORKFLOWS - WorkflowOverviewWidget
     * @property {string} TASK_ATTACHMENTS - TaskAttachmentWidget
     * @property {string} BRAVAENTERPRISE - BravaEnterpriseViewerWidget
     * @property {string} BRAVAIV - OpenTextIntelligentViewingWidget
     *
     */
    D2: WidgetConstantsImpl.D2,

    /**
     * OOTB Default widget types available in D2 Smart View runtime.
     *
     * All of these default widget type names(including any new ones introduced by a D2 Plugin) could be calculated by normalizing
     * the default widget's XML tagname from the Smart View landing page xml configuration. In the normalization process any special
     * non-word character from the tagname needs to be removed.
     *
     * For an example if the xml tag name is `<my-custom-wdiget></my-custom-widget>`, it normalizes into `mycustomwidget` after removing all the `'-'` characters.
     * Another example `<task-attachments-widget></task-attachments-widget>` to `taskattachmentswidget`.
     * @memberOf module:WidgetConstants
     * @type {Object}
     * @property {string} VERSIONS - versionwidget
     * @property {string} RENDITIONS - renditionwidget
     * @property {string} RELATIONS - relationwidget
     * @property {string} SEARCH - doclistsearchresultswidget
     * @property {string} DOCLIST - doclistwidget
     * @property {string} FAVORITES - favoriteswidget
     * @property {string} BRAVACSR - bravacsrwidget
     * @property {string} VDOC - vdocwidget
     * @property {string} TASKS - taskswidget
     * @property {string} TASK_ATTACHMENTS - taskattachmentswidget
     * @property {string} MY_WORKFLOWS - myworkflowswidget
     * @property {string} ALL_WORKFLOWS - allworkflowswidget
     * @property {string} BRAVAENTERPRISE - bravaenterprisewidget
     * @property {string} BRAVAIV - otivwidget
     */
    DEFAULT: WidgetConstantsImpl.DEFAULT
  });
});