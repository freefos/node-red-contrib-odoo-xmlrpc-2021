module.exports = function (RED) {
  function isDefinedValue(v) {
    return !(v == null || typeof v === 'undefined');
  }

  function OdooXMLRPCExecNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    this.host = RED.nodes.getNode(config.host);

    node.on('input', async function (msg, send, done) {
      node.status({});
      send = send || function () { node.send.apply(node, arguments); };

      try {
        const odoo = await node.host.connect(); // host.connect() now resolves to odoo instance

        const method = msg.method || config.method;
        const model = config.model;

        const args = msg.payload;
        if (!Array.isArray(args)) {
          throw new Error("msg.payload must be an array of arguments");
        }

        const kwargs = msg.kwargs || {};

        node.log(`Calling ${model}.${method} with args: ${JSON.stringify(args)} and kwargs: ${JSON.stringify(kwargs)}`);

        const result = await odoo.execute_kw(model, method, args, kwargs);

        msg.payload = result;
        node.status({ fill: "green", shape: "dot", text: `${method} executed` });
        send(msg);
        done();
      } catch (err) {
        node.log(err.body || err.message);
        node.status({ fill: "red", shape: "dot", text: err.message });
        done(err);
      }
    });
  }

  RED.nodes.registerType("odoo-xmlrpc-exec", OdooXMLRPCExecNode);
};
