/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'nuc/lib/underscore',
  'csui/utils/commands',
  'csui-ext!d2/sdk/utils/commands'
], function(_, csuiCommands, extCommands){
  'use strict';

  /**
   * CommandCollection. A collection of all the registered commands, used by a toolbar to link executable actions for menus.
   * can also be used to look up and run the executable code in a particular context without a backing toolbar.
   *
   * To implement a business logic as command and get it registered with this collection, see -
   *
   * * {@link ../commands/command|CommandModel}
   * * {@link ../commands/progressive.nodes.command|ProgressiveNodesCommand}
   *
   * @example <caption>A particular command within this collection could be looked up, tried and executed as</caption>
   *
   * define([
   *    'd2/sdk/utils/commands',
   *    'd2/sdk/models/node.model',
   *    'd2/sdk/models/node.collection',
   *    'd2/sdk/utils/contexts/context.utils',
   *    'd2/sdk/utils/contexts/factories/connector'
   * ], function(commands, NodeModel, NodeCollection, contextUtil, ConnectorFactory){
   *    'use strict';
   *
   *    var node = new NodeModel({
   *      id: '0b0015fa80005598'
   *    },{
   *      connector: contextUtil.getPerspectiveContext().getObject(ConnectorFactory)
   *    });
   *
   *    node.fetch().done(function(){
   *      var status = {
   *        nodes: [node]
   *      };
   *
   *      var myCommand = commands.get('MyCommand');
   *      if(myCommand && myCommand.enabled(status)) {
   *        myCommand.execute(status)
   *          .then(function(){
   *            console.log('MyCommand completed successfully');
   *          })
   *          .catch(function(){
   *            console.log('MyCommand has failed to execute');
   *          });
   *      }
   *    });
   *
   * });
   *
   *
   * @module {d2/sdk/utils/commands} d2/sdk/utils/commands
   * @name CommandCollection
   * @extends external:Backbone.Collection
   *
   */

  /**
   * @external "Backbone.Collection"
   * @see https://backbonejs.org/#Collection
   */

  var commands = csuiCommands;

  if (extCommands) {
    commands.add(
      _.chain(extCommands)
        .flatten(true)
        .map(function (CommandModel) {
          return new CommandModel();
        })
        .value()
    );
  }

  return commands;
});