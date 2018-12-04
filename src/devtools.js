/* @jsx h */

const RadiDevtools = (function() {
  const version = '0.0.1';

  function attatch(_radi) {
    const { h } = _radi;

    const LOGO = 'data:image/png;base64,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';

    const dev = new _radi.Store({
      stores: [],
      actions: [],
      active: 0,
    })
    const storeHolder = {};

    function stripFunctions(target) {
      var out = {}
      if (target.$loading) {
        Object.defineProperty(out, '$loading', {
          value: true,
          writable: false
        });
      }

      for (var i in target) {
        if (typeof target[i] === 'function') {
          out[i] = {};
          Object.defineProperty(out[i], '$loading', {
            value: true,
            writable: false
          });
        } else {
          out[i] = (typeof target[i] === 'object' && !Array.isArray(target[i])) ? stripFunctions(target[i]) : target[i];
        }
      }

      return out
    }

    const setActive = ({actions, stores, active}, newActive) => {
      let current = actions.reduce((acc, nn, ii) => nn.index === newActive ? ii + 1 : acc, 0);
      let inBetweenActions = actions.slice(current, active);
      let originals = actions
        .slice(0, current)
        .reduce(
          (acc, act) => (acc[act.store] = (acc[act.store] || []).concat(act.payload),acc),
          {}
        );

      for (var i = 0; i < stores.length; i++) {
        if (typeof originals[stores[i]] !== 'undefined') {
          storeHolder[stores[i]].update(
            Object.assign(
              stripFunctions(storeHolder[stores[i]].getInitial()),
              ...originals[stores[i]].map(stripFunctions)
            ), true
          );
        } else {
          for (var n = 0; n < inBetweenActions.length; n++) {
            if (stores[i] === inBetweenActions[n].store) {
              storeHolder[stores[i]].update(
                Object.assign(
                  stripFunctions(storeHolder[stores[i]].getInitial()),
                  stripFunctions(inBetweenActions[n].payload)
                ), true
              );
              break;
            }
          }
        }
      }

      return { active: newActive };
    }
    const next = ({actions, active}) => {
      const go = actions.reduce((acc, nn, ii) => nn.index === active ? ii : acc, 0) + 1;
      if (go < actions.length) {
        dev.dispatch(setActive, actions[go].index);
      }
    }
    const previous = ({actions, active}) => {
      const go = actions.reduce((acc, nn, ii) => nn.index === active ? ii : acc, 0) - 1;
      if (go >= 0) {
        dev.dispatch(setActive, actions[go].index);
      }
    }
    const addStore = ({stores}, newStore) => ({stores: stores.concat(newStore)})
    const addAction = ({actions, active}, newAction) => {
      const lastIndex = actions.length && actions[actions.length - 1].index || 0;
      let actionSet = (lastIndex !== active && actions.slice(0, actions.reduce((acc, nn, ii) => nn.index === active ? ii + 1 : acc, 0))) || actions;
      newAction.index = lastIndex + 1;
      return {
        actions: actionSet.concat(newAction),
        active: lastIndex + 1,
      };
    }

    let current = new Date().getTime()
    const time = () => {
      const tempTime = current;
      current = new Date().getTime();
      return () => current - tempTime;
    }

    function Store(state, name) {
      const storeName = name || 'unnamed-' + (dev.get().stores.length + 1);
      dev.dispatch(addStore, storeName);
      let a = _radi.Store(state);
      const superUpdate = a.update;
      const superDispatch = a.dispatch;
      storeHolder[storeName] = {
        getInitial: a.getInitial,
        update: superUpdate,
      };

      a.update = function(payload, noSubs, fn, newTime) {
        if (fn) {
          dev.dispatch(addAction, {
            name: fn.name,
            payload: stripFunctions(payload),
            time: (newTime() / 1000).toFixed(2),
            store: storeName,
          })
        }
        return superUpdate(payload, noSubs)
      }

      a.dispatch = function(fn, ...args) {
        const payload = fn(a.get(), ...args);
        // console.log('dispatch', {
        //   action: fn.name,
        //   args: args,
        //   payload,
        // });
        // console.log('dispatch', fn.name, payload);
        return this.update(payload, false, fn, time());
      }

      dev.dispatch(addAction, {
        name: 'Initial State',
        payload: stripFunctions(state),
        time: (0).toFixed(2),
        store: storeName,
      })

      return a;
    }

    const container = document.createElement('div');
    document.body.appendChild(container)

    function DevApp() {
      this.style = `
        #radiDevTools {
          display: block;
          width: 300px;
          position: fixed;
          right: 0;
          top: 0;
          height: 100%;
          z-index: 1000;
          background-color: #1f2323;
          color: #f0f0f0;
          padding: 10px;
          overflow-y: auto;
          overflow-h: hidden;
        }
        #radiDevTools .radi-dev-tool-logo {
          display: block;
          text-align: center;
          padding: 10px;
        }
        #radiDevTools .radi-dev-tool-logo img {
          width: 50%;
        }
        #radiDevTools > ul {
          display: block;
          width: 100%;
          margin: 0;
          padding: 0;
          list-style: none;
          cursor: default;
        }
        #radiDevTools > ul > li.action {
          display: block;
          width: 100%;
          padding: 10px;
          background-color: #2d292d;
          border-bottom: 2px solid #1e2323;
          position: relative;
        }
        #radiDevTools > ul > li.action:hover {
          background-color: #3d3240;
        }
        #radiDevTools > ul > li.action.active {
          background-color: #725084;
        }
        #radiDevTools > ul > li.action > i {
          position: absolute;
          right: 10px;
          font-size: 12px;
          opacity: 0.5;
        }
        #radiDevTools > ul > li.action > strong {
          display: block;
          font-size: 14px;
          font-weight: normal;
          color: #98839e;
          margin-bottom: 4px;
        }
        #radiDevTools > ul > li.action > strong strong {
          color: #fff;
        }
        #radiDevTools > ul > li.action > span {
          color: #d9acff;
          font-size: 12px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-family: monospace;
          display: block;
          width: 100%;
        }
        #radiDevTools hr {
          border: 0;
          display: block;
          height: 2px;
          background-color: #444143;
          margin: 10px 0;
        }
      `

      return h(
        "div",
        { id: "radiDevTools" },
        h(
          "div",
          { class: "radi-dev-tool-logo" },
          h("img", { src: LOGO, alt: "Radi devtools logo" })
        ),
        h("hr", null),
        "Stores:",
        h(
          "ul",
          null,
          dev(({stores}) => stores.map(store => h("li", { class: "store" }, "- ", store))),
          h("hr", null),
          h("button", { onclick: e => dev.dispatch(previous) }, "Previous"),
          h("button", { onclick: e => dev.dispatch(next) }, "Next"),
          h("hr", null),
          dev(({actions, active}) => (
            actions.map(action =>
              h(
                "li",
                {
                  onclick: e => dev.dispatch(setActive, action.index),
                  class: ["action", active === action.index && "active"]
                    .filter(a => a)
                    .join(" ")
                },
                h("i", null, "+ ", action.time, "s"),
                h(
                  "strong",
                  null,
                  h("strong", null, action.name),
                  " @ ",
                  action.store
                ),
                h("span", null, JSON.stringify(action.payload))
              )
            )
          ))
        )
      )
      // return (
      //   <div id="radiDevTools">
      //     <div class="radi-dev-tool-logo">
      //       <img src={LOGO} alt="Radi devtools logo"/>
      //     </div>
      //     <hr/>
      //     Stores:
      //     <ul>
      //       {dev.render(({stores}) => stores.map(store => (
      //         <li class="store">- {store}</li>
      //       )))}
      //       <hr/>
      //       <button onclick={e => dev.dispatch(previous)}>Previous</button>
      //       <button onclick={e => dev.dispatch(next)}>Next</button>
      //       <hr/>
      //       {dev.render(({actions, active}) => actions.map(action => (
      //         <li onclick={e => dev.dispatch(setActive, action.index)} class={['action', active === action.index && 'active'].filter(a => a).join(' ')}>
      //           <i>+ {action.time}s</i>
      //           <strong><strong>{action.name}</strong> @ {action.store}</strong>
      //           <span>{JSON.stringify(action.payload)}</span>
      //         </li>
      //       )))}
      //     </ul>
      //   </div>
      // )
    }

    _radi.mount(
      h(DevApp),
      container
    )



    return {
      ..._radi,
      Store,
    }
  }

  return {
    v: version,
    attatch: attatch
  }
})()
