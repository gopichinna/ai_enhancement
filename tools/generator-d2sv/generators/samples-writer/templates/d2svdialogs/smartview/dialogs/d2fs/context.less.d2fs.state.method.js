import D2FSStateMethod from 'd2/sdk/controls/dialogs/generic/d2fs.state.method';

class ContextLessD2FSStateMethod extends D2FSStateMethod {
  execute(options, result) {
    return new Promise((res, rej)=>{
      super.execute(options, result)
        .then(() => {
          res(false);
        })
        .catch(rej);
    });
  }

  setDialogContextForm() {

  }
}

export default ContextLessD2FSStateMethod;