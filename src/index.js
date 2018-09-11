const RadiExperiment = (function() {
  const version = '0.0.1';

  function flatten(arr) {
    let i = 0;
    while (i < arr.length) {
      Array.isArray(arr[i]) && arr.splice(i, 1, ...arr[i]) || i++;
    }
    return arr;
  }

  function fireEvent(type, node) {
    const onEvent = document.createEvent('Event');
    onEvent.initEvent(type, true, true);

    if (typeof node.dispatchEvent === 'function') {
      node._eventFired = true;
      node.dispatchEvent(onEvent);
    }
    return node;
  }

  function isNode(node) {
    return node instanceof Node;
  }

  function insertAfter(newNode, referenceNode, $parent) {
    if (!$parent) $parent = referenceNode.parentNode;

    if (isNode(newNode)) {
      if (referenceNode === null || referenceNode === undefined) {
        return $parent.insertBefore(newNode, referenceNode);
      }

      if (isNode(referenceNode)) {
        return $parent.insertBefore(newNode, referenceNode.nextSibling);
      }
    }
  };

  function h(type, props, ...children) {
    if (typeof type === 'number') {
      type = type + '';
    }
    return { type, props: props || {}, children: flatten(children) };
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
    if (name === 'style') {
      setStyles($target, value);
    } else if (isCustomProp(name)) {
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

  function setStyles($target, styles) {
    Object.keys(styles).forEach(name => {
      $target.style[name] = styles[name];
    })
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

  function capitalise(lower) {
    return lower.charAt(0).toUpperCase() + lower.substr(1);
  }

  function changed(node1, node2) {
    if (node1 === undefined || node2 === undefined) return false;
    if (typeof node1 !== typeof node2) return true;
    if ((typeof node1 === 'string' || typeof node1 === 'number')
      && node1 !== node2) return true;
    if (node1.type !== node2.type) return true;
    if (node1.props && node1.props.forceUpdate) return true;

    return false;
  }

  function nodeDestroyer(node) {
    fireEvent('destroy', node);

    if (node.nodeType === 1) {
      var curChild = node.firstChild;
      while (curChild) {
        nodeDestroyer(curChild);
        curChild = curChild.nextSibling;
      }
    }
  }

  function createElement(node, $parent) {
    if (typeof node === 'string' || typeof node === 'number') {
      return document.createTextNode(node);
    }

    if (node === undefined || node === false || node === null) {
      return document.createComment('');
    }

    if (Array.isArray(node)) {
      const $pointer = document.createTextNode('');

      $pointer.addEventListener('mount', () => {
        for (var i = 0; i < node.length; i++) {
          mount(node[i], $parent);
        }
      })

      return $pointer;
    }

    if (typeof node === 'function' || typeof node.type === 'function') {
      const fn = node.type || node;
      const lifecycles = {
        __$events: {},
        onMount: () => {},
        on: (event, fn) => {
          const e = lifecycles.__$events;
          const name = 'on' + capitalise(event);
          if (!e[name]) e[name] = [];
          e[name].push(fn);
        },
        trigger: (event, ...args) => {
          const name = 'on' + capitalise(event);
          (lifecycles.__$events[name] || [])
            .map(e => e(...args));
          if (typeof lifecycles[name] === 'function') {
            lifecycles[name](...args);
          }
        }
      }

      const $element = createElement(
        fn.call(lifecycles, {
          ...(node.props || {}),
          children: node.children || [],
        }),
        $parent
      );

      if ($element && typeof $element.addEventListener === 'function') {
        $element.addEventListener('mount', () => {
          lifecycles.trigger('mount', $element, $parent);
        }, {
          passive: true,
          once: true,
        }, false)

        $element.addEventListener('destroy', (e) => {
          lifecycles.trigger('destroy', $element, $parent);
        }, {
          passive: true,
          once: true,
        }, false)
      }

      return $element;
    }

    if (typeof node === 'object') {
      if (node.type) {
        const $el = document.createElement(node.type);
        let $lastEl = null;
        setProps($el, node.props);
        addEventListeners($el, node.props);
        const applyChildren = $el => n => {
          const $n = createElement(n, $el);
          if ($n) {
            // if (Array.isArray(n)) {
            //   n.map(applyChildren($el));
            // } else
            if ($lastEl) {
              insertAfter($n, $lastEl, $el);
            } else {
              $el.appendChild.call($el, $n);
              fireEvent('mount', $n);
            }
          }
        }
        node.children.map(applyChildren($el));
        return $el;
      }
      return createElement(JSON.stringify(node), $parent);
    }

    console.error('Unhandled node', node)
  }

  function ensureArray(a) {
    if (arguments.length === 0) return [];
    if (arguments.length === 1) {
      if (a === undefined || a === null) return [];
      if (Array.isArray(a)) return a;
    }
    return Array.prototype.slice.call(arguments);
  }

  function updateElement($parent, newNode, oldNode, index = 0, $pointer) {
    let $output = $parent && $parent.childNodes[index];
    if ($pointer) {
      index = Array.prototype.indexOf.call($parent.childNodes, $pointer) + 1;
    }

    const normalNewNode = flatten(ensureArray(newNode));
    const normalOldNode = flatten(ensureArray(oldNode));
    const newLength = normalNewNode.length;
    const oldLength = normalOldNode.length;

    for (let i = 0; i < newLength || i < oldLength; i++) {
      if (normalNewNode[i] instanceof Date) normalNewNode[i] = normalNewNode[i].toString();
      if (normalOldNode[i] === false || normalOldNode[i] === undefined || normalOldNode[i] === null) {
        $output = createElement(normalNewNode[i], $parent);
        if ($pointer) {
          insertAfter($output, $parent.childNodes[(index + i - 1)], $parent);
        } else {
          $parent.appendChild($output);
        }
        fireEvent('mount', $output);
      } else
      if (normalNewNode[i] === false || normalNewNode[i] === undefined || normalNewNode[i] === null) {
        const $target = $parent.childNodes[index];
        if ($target) {
          $parent.removeChild($target);
          nodeDestroyer($target);
        }
      } else
      if (changed(normalNewNode[i], normalOldNode[i])) {
        $parent.replaceChild(
          $output = createElement(normalNewNode[i], $parent),
          $parent.childNodes[index + i]
        );
        fireEvent('mount', $output);
      } else if (typeof normalNewNode[i].type === 'string') {
        const childNew = normalNewNode[i];
        const childOld = normalOldNode[i];
        updateProps(
          $parent.childNodes[index + i],
          childNew.props,
          childOld.props
        );
        const newLength2 = childNew.children.length;
        const oldLength2 = childOld.children.length;
        for (let n = 0; n < newLength2 || n < oldLength2; n++) {
          updateElement(
            $parent.childNodes[index + i],
            childNew.children[n],
            childOld.children[n],
            n
          );
        }
      }
    }

    return normalNewNode;
  }

  function mount(component, container) {
    return {
      component: component,
      node: updateElement(container, component),
      destroy: () => {
        return updateElement(container, null);
      },
    };
  };

  function Store(state = {}) {
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
        // console.log('dispatch', fn.name, payload);
        return this.update(payload);
      },
      render: function (fn = (state) => JSON.stringify(state)) {
        let $parent;
        let $pointer;
        let $current;
        let newTree;
        let oldTree;

        function update(state) {
          newTree = fn(state);
          $current = updateElement($parent, newTree, oldTree, 0, $pointer);
          oldTree = newTree;
        }

        subscriptions.push((state, ...args) => {
          update(state);
        });

        function item() {
          this.onMount = (element, parent) => {
            $pointer = element;
            $parent = parent || element.parentNode;
            update(STORE);
          }
          return '';
        };

        return item;
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
