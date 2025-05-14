function isDefinedValue(v){
  return !(v == null || typeof v === 'undefined');
}

function isUInt(v){
  return typeof v === 'number' && Math.floor(v) === v && v >= 0;
}

module.exports = function (RED) {
  var handle_error = function(err, node, done) {
    node.log(err.body || err.message);
    node.status({fill: "red", shape: "dot", text: err.message});

    if (done) { 
      done(err); 
    } else {
      node.error(err, err.message);
    }
  };

  function OdooXMLRPCExecNode(config) {
    RED.nodes.createNode(this, config);
    this.host = RED.nodes.getNode(config.host);
    var node = this;

    node.on('input', function (msg, send, done) {
      node.status({});
      send = send || function() { node.send.apply(node, arguments); };

      this.host.connect(function(err, odoo_inst) {
        if (err) {
          return handle_error(err, node, done);
        }

        var method = config.method;
        if (isDefinedValue(msg.method)) {
          node.log('method overwritten by msg');
          method = msg.method;
        }

        // Payload is the base arguments list
        var args = msg.payload;
        if (!isDefinedValue(args)) {
          return handle_error(new Error('msg.payload must be an array of arguments'), node, done);
        }
        if (!Array.isArray(args)) {
          return handle_error(new Error('msg.payload must be an array (even if only one arg)'), node, done);
        }

        // Optional keyword arguments
        var kwargs = msg.kwargs || {};

        // Log for debugging
        node.log(`Calling ${config.model}.${method} with args: ${JSON.stringify(args)} and kwargs: ${JSON.stringify(kwargs)}`);

        odoo_inst.execute_kw(config.model, method, args, kwargs, function (err, value) {
          if (err) {
            return handle_error(err, node, done);
          }

          msg.payload = value;

          if (value === true) {
            node.status({fill:"green",shape:"dot",text:"'" + method + "' executed"});
          }

          send(msg);
          if (done) { done(); }
        });
      });
    });
  }

  RED.nodes.registerType("odoo-xmlrpc-exec", OdooXMLRPCExecNode);
};
