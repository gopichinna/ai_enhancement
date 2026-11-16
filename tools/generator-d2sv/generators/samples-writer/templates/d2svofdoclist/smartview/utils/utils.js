import require from 'require';

function openFolder({id}) {
  return new Promise((res, rej)=>{
    require([
      'd2/sdk/models/node.model',
      'd2/sdk/models/node.collection',
      'd2/sdk/utils/commands',
      'd2/sdk/utils/session'
    ], (NodeModel, NodeCollection, commands, Session)=>{
      const cmdBrowse = commands.get('Browse');
      if(cmdBrowse) {
        cmdBrowse.execute({
          context: Session.get().getContext(),
          nodes: new NodeCollection([new NodeModel({id: id})])
        }).done(res).fail(rej);
      } else {
        rej('Browse command not found');
      }
    }, rej);
  });
}

export default {openFolder};