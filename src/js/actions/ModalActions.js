var consts = require('./CoreActionConsts');
module.exports.showModalContainer = function(val) {
  return {
    type: consts.SHOW_MODAL_CONTAINER,
    val:val
  }
}