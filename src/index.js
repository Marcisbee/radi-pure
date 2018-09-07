const RadiExperiment = (function() {
  const version = '0.0.1';

  function isNode(node) {
    return node instanceof Node;
  }

  const insertAfter = function (newNode, referenceNode, $parent) {
    if (!$parent) $parent = referenceNode.parentNode;

    if (arguments.length < 2) {
      throw (new TypeError("Failed to execute 'insertAfter' on 'Node': 2 arguments required, but only " + arguments.length + " present."));
    }

    if (isNode(newNode)) {
      if (referenceNode === null || referenceNode === undefined) {
        return $parent.insertBefore(newNode, referenceNode);
      }

      if (isNode(referenceNode)) {
        return $parent.insertBefore(newNode, referenceNode.nextSibling);
      }

      throw (new TypeError("Failed to execute 'insertAfter' on 'Node': parameter 2 is not of type 'Node'."));
    }

    throw (new TypeError("Failed to execute 'insertAfter' on 'Node': parameter 1 is not of type 'Node'."));
  };

  function h(type, props, ...children) {
    if (typeof type === 'number') {
      type = type + '';
    }
    return { type, props: props || {}, children };
  }

  function setBooleanProp($target, name, value) {
    if (value) {
      $target.setAttribute(name, value);
      $target[name] = true;
    } else {
      $target[name] = false;
    }
  }

  function removeBooleanProp($target, name) {
    $target.removeAttribute(name);
    $target[name] = false;
  }

  function isEventProp(name) {
    return /^on/.test(name);
  }

  function extractEventName(name) {
    return name.slice(2).toLowerCase();
  }

  function isCustomProp(name) {
    return isEventProp(name) || name === 'forceUpdate';
  }

  function setProp($target, name, value) {
    if (isCustomProp(name)) {
      return;
    } else if (name === 'className') {
      $target.setAttribute('class', value);
    } else if (typeof value === 'boolean') {
      setBooleanProp($target, name, value);
    } else {
      $target.setAttribute(name, value);
    }
  }

  function removeProp($target, name, value) {
    if (isCustomProp(name)) {
      return;
    } else if (name === 'className') {
      $target.removeAttribute('class');
    } else if (typeof value === 'boolean') {
      removeBooleanProp($target, name);
    } else {
      $target.removeAttribute(name);
    }
  }

  function setProps($target, props) {
    Object.keys(props).forEach(name => {
      setProp($target, name, props[name]);
    });
  }

  function updateProp($target, name, newVal, oldVal) {
    if (!newVal) {
      removeProp($target, name, oldVal);
    } else if (!oldVal || newVal !== oldVal) {
      setProp($target, name, newVal);
    }
  }

  function updateProps($target, newProps, oldProps = {}) {
    const props = Object.assign({}, newProps, oldProps);
    Object.keys(props).forEach(name => {
      updateProp($target, name, newProps[name], oldProps[name]);
    });
  }

  function addEventListeners($target, props) {
    Object.keys(props).forEach(name => {
      if (isEventProp(name)) {
        $target.addEventListener(
          extractEventName(name),
          props[name]
        );
      }
    });
  }

  function createElement(node, $parent) {
    if (typeof node === 'string' || typeof node === 'number' || (typeof node === 'boolean' && node) || node instanceof Date) {
      return document.createTextNode(node);
    }

    if (!node) {
      return null;
    }

    if (node.type === 'store') {
      node.props($parent);
      return null;
    }

    if (typeof node === 'object'
      && !(node.type
        && node.props
        && node.children)) {
      // return document.createTextNode(JSON.stringify(node));
      return document.createTextNode((node));
    }

    if (typeof node.type === 'function') {

      let lifecycles = {
        onMount: () => { },
      }

      let $element = createElement(node.type.call(lifecycles, { ...node.props, children: node.children }), $parent);

      $element.onMount = () => {
        lifecycles.onMount();
        return $element;
      };

      return $element;
    }

    const $el = document.createElement(node.type);
    let $lastEl = null;
    setProps($el, node.props);
    addEventListeners($el, node.props);
    const applyChildren = $el => n => {
      const $n = createElement(n, $el);
      if ($n) {
        if (Array.isArray(n)) {
          n.map(applyChildren($el));
        } else
        if ($lastEl) {
          insertAfter($n, $lastEl, $el);
        } else {
          $el.appendChild.call($el, $n);
        }
        if (typeof $n.onMount === 'function') $n.onMount();
      }
    }
    node.children.map(applyChildren($el));
    return $el;
  }

  function changed(node1, node2) {
    return typeof node1 !== typeof node2 ||
      (
        (typeof node1 === 'string' || typeof node1 === 'number')
        && node1 !== node2) ||
      node1.type !== node2.type ||
      node1.props && node1.props.forceUpdate;
  }

  function updateElement($parent, newNode, oldNode, index = 0) {
    let $output = $parent.childNodes[index];
    if (newNode instanceof Date) newNode = newNode.toString();
    if (!oldNode && typeof oldNode !== 'number' && typeof oldNode !== 'string') {
      $parent.appendChild(
        $output = createElement(newNode, $parent)
      );
      if ($output && typeof $output.onMount === 'function') $output.onMount();
    } else if (!newNode && typeof newNode !== 'number' && typeof newNode !== 'string') {
      $parent.removeChild(
        $parent.childNodes[index]
      );
    } else if (changed(newNode, oldNode)) {
      $parent.replaceChild(
        $output = createElement(newNode, $parent),
        $parent.childNodes[index]
      );
      if ($output && typeof $output.onMount === 'function') $output.onMount();
    } else if (newNode.type) {
      updateProps(
        $parent.childNodes[index],
        newNode.props,
        oldNode.props
      );
      const newLength = newNode.children.length;
      const oldLength = oldNode.children.length;
      for (let i = 0; i < newLength || i < oldLength; i++) {
        updateElement(
          $parent.childNodes[index],
          newNode.children[i],
          oldNode.children[i],
          i
        );
      }
    }
    return $output;
  }

  // const portal = (render) => {
  //   let $parent;
  //   let $current;
  //   let index = 0;
  //   let newTree;
  //   let oldTree;

  //   const newContent = render((content) => {
  //     $current = updateElement($parent, newTree, oldTree, index);
  //     // console.log({$parent, newTree, oldTree, index, $current});
  //     index = Array.prototype.indexOf.call($current.parentNode.childNodes, $current);
  //     oldTree = newTree;
  //   });

  //   // subscriptions.push((state, ...args) => {
  //   //   newTree = fn(state);
  //   //   $current = updateElement($parent, newTree, oldTree, index);
  //   //   // console.log({$parent, newTree, oldTree, index, $current});
  //   //   index = Array.prototype.indexOf.call($current.parentNode.childNodes, $current);
  //   //   oldTree = newTree;
  //   // });
  //   return {
  //     type: 'portal',
  //     props: ($newParent) => {
  //       $parent = $newParent;
  //       $current = updateElement($parent, newTree, null, 0);
  //       index = Array.prototype.indexOf.call($current.parentNode.childNodes, $current);
  //       oldTree = newTree;
  //     },
  //   };
  // }

  // portal((passContent) => {
  //   store.subscribe(state => {
  //     passContent(<h1>Hello { state.count }</h1>);
  //   });

  // })

  const mount = (component, container) => {
    // let node = patch(null, component(), container);

    return {
      component: component,
      node: updateElement(container, component),
      destroy: () => {
        return updateElement(container, null);
      },
    };

    // component.subscribe((render) => {
    //   console.log('->');
    //   node = patch(node, render(), container);
    // });
  };

  // mount(myApp, app);





  // const {
  //   dispatch,
  //   listen,
  //   store,
  // } = Radi;

  function Store(state) {
    let subscriptions = [];

    let STORE = {
      ...state,
    };

    Object.setPrototypeOf(STORE, {
      update: function (chunkState) {
        const newState = {
          ...STORE,
          ...chunkState,
        }
        subscriptions.map(s => {
          if (typeof s === 'function') {
            s(newState);
          }
        });
        return STORE = newState;
      },
      subscribe: function (fn) {
        subscriptions.push(fn);
      },
      dispatch: function (fn, ...args) {
        const payload = fn(STORE, ...args);
        // console.log('dispatch', {
        //   action: fn.name,
        //   args: args,
        //   payload,
        // });
        console.log('dispatch', fn.name, payload);
        return this.update(payload);
      },
      render: function (fn) {
        let $parent;
        let $current;
        let index = 0;
        let newTree;
        let oldTree;

        subscriptions.push((state, ...args) => {
          newTree = fn(state);
          $current = updateElement($parent, newTree, oldTree, index);
          // console.log({$parent, newTree, oldTree, index, $current});
          index = Array.prototype.indexOf.call($current.parentNode.childNodes, $current);
          oldTree = newTree;
        });
        return {
          type: 'store',
          props: ($newParent) => {
            $parent = $newParent;
            newTree = fn(STORE);
            $current = updateElement($parent, newTree, null, 0);
            index = Array.prototype.indexOf.call($current.parentNode.childNodes, $current);
            oldTree = newTree;
          },
        };
      },
      map: function(fn) {
        const mapped = new Store(fn(STORE));
        STORE.subscribe((state) => {
          const newState = fn(state);
          if (JSON.stringify(newState) !== JSON.stringify(fn(STORE))) {
            mapped.update(newState);
          }
        });
        return mapped;
      },
    });

    return STORE;
  }

  return {
    v: version,
    h: h,
    Store: Store,
    mount: mount
  }
})()
