import ContextLessD2FSStateMethod from '<%= namespace %>/dialogs/d2fs/context.less.d2fs.state.method';

export default [
  {
    and: {
      equals: {formName: 'SelectivePropertyDisplay'},
      includes:{"method": ["GET", "VALIDATE", "CANCEL"]}
    },
    methodClass: ContextLessD2FSStateMethod, sequence: 9999}
];