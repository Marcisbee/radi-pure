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
  }

  function autoUpdate(value, fn) {
    if (typeof value === 'function' && value.__radiStateUpdater) {
      return value(fn);
    } else {
      return fn(value);
    }
  }

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
      autoUpdate(styles[name], value => {
        $target.style[name] = value;
      });
    });
  }

  function setProps($target, props) {
    Object.keys(props).forEach(name => {
      autoUpdate(props[name], value => {
        if (name === 'class' || name === 'className') {
          if (Array.isArray(value)) {
            value = value.filter(v => v && typeof v !== 'function').join(' ');
          }
        }
        setProp($target, name, value);
      });
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
      autoUpdate(newProps[name], value => {
        updateProp($target, name, value, oldProps[name]);
      });
    });
  }

  function addEventListeners($target, props) {
    const exceptions = ['mount', 'destroy'];
    Object.keys(props).forEach(name => {
      if (isEventProp(name)) {
        $target.addEventListener(
          extractEventName(name),
          (e) => {
            if (exceptions.indexOf(name) >= 0) {
              if ($target === e.target) props[name](e);
            } else {
              props[name](e);
            }
          },
          false
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
        name: fn.name,
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

      let $styleRef;

      if ($element && typeof $element.addEventListener === 'function') {
        $element.addEventListener('mount', (e) => {
          if (typeof lifecycles.style === 'string') {
            $styleRef = document.createElement('style')
            $styleRef.innerHTML = lifecycles.style;
            document.head.appendChild($styleRef);
          }
          lifecycles.trigger('mount', $element, $parent);
        }, {
          passive: true,
          once: true,
        }, false)

        $element.addEventListener('destroy', (e) => {
          lifecycles.trigger('destroy', $element, $parent);
          if ($styleRef instanceof Node) {
            document.head.removeChild($styleRef);
          }
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

    console.error('Unhandled node', node);
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

    let modifier = 0;
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
        const $target = $parent.childNodes[index + i + modifier];
        if ($target) {
          $parent.removeChild($target);
          nodeDestroyer($target);
          modifier -= 1;
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

  function setDataInObject(source, path, data) {
    const name = path[0]
    let out = {
      [name]: source[name],
    };
    let temp = out;
    let i = 0;
    while (i < path.length-1) {
      temp = temp[path[i++]]
    }
    temp[path[i]] = data
    return out
  }

  function map(target, store, source, path = []) {
    let out = {};
    if (target && target.$loading) {
      Object.defineProperty(out, '$loading', {
        value: true,
        writable: false
      });
    }
    if (!source) source = out;

    for (let i in target) {
      const name = i;
      if (typeof target[i] === 'function') {
        out[name] = {};
        Object.defineProperty(out[name], '$loading', {
          value: true,
          writable: false
        });
        target[i]((data, useUpdate) => {
          let payload = setDataInObject(source, path.concat(name), data);
          if (!useUpdate) {
            store.dispatch(function Fetch() { return payload });
          } else {
            store.update(payload);
          }
        })
      } else {
        out[name] = target[name] && typeof target[name] === 'object'
          && !Array.isArray(target[name])
            ? map(target[name], store, source, path.concat(name))
            : target[name]
      }
    }

    return out;
  }

  function Store(state = {}) {
    const OUT = {};
    let subscriptions = [];
    let subscriptionsStrict = [];
    let latestStore;

    Object.setPrototypeOf(OUT, {
      getInitial: function() {
        return STORE;
      },
      get: function() {
        return latestStore;
      },
      update: function (chunkState, noStrictSubs) {
        const newState = {
          ...latestStore,
          ...map(chunkState, OUT),
        }
        latestStore = newState;
        if (!noStrictSubs) {
          subscriptionsStrict.map(s => {
            if (typeof s === 'function') {
              s(newState);
            }
          });
        }
        subscriptions.map(s => {
          if (typeof s === 'function') {
            s(newState);
          }
        });
        return latestStore;
      },
      subscribe: function (fn, strict) {
        if (strict) {
          subscriptionsStrict.push(fn);
        } else {
          subscriptions.push(fn);
        }
      },
      dispatch: function (fn, ...args) {
        const payload = fn(latestStore, ...args);
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
        let mounted = false;

        function update(state) {
          newTree = fn(state);
          $current = updateElement($parent, newTree, oldTree, 0, $pointer);
          oldTree = newTree;
        }

        subscriptions.push((state, ...args) => {
          if (mounted) {
            update(state);
          }
        });

        function item() {
          this.onMount = (element, parent) => {
            mounted = true;
            $pointer = element;
            $parent = parent || element.parentNode;
            update(latestStore);
          }
          return '';
        };

        return item;
      },
      inject: function(update) {
        if (typeof update !== 'function') {
          console.warn('[Radi.js] Store\'s `.inject()` method must not be called on it\'s own. Instead use `{ field: Store.inject }`.');
          return false;
        }
        OUT.subscribe(update, true);
        update(latestStore, true);
      },
      out: function(fn) {
        let lastValue;
        function stateUpdater(update) {
          if (typeof update === 'function') {
            OUT.subscribe(s => {
              const newValue = fn(s);
              if (lastValue !== newValue) {
                update(newValue);
              }
            });
            update(lastValue = fn(latestStore), true);
          } else {
            let a = OUT.render(fn);
            return a;
          }
        }
        stateUpdater.__radiStateUpdater = true;
        return stateUpdater;
      },
    });

    const STORE = map(state, OUT);

    latestStore = STORE;

    return OUT;
  }

  function Fetch(url, map) {
    // const load = (next) => (setTimeout(() => next(map({user:{_key: 123}})), 5000))
    return (payload) => {
      return (update) => setTimeout(update, 1000, map({user: {_key: 123} }))
      // return (update) => load((data) => state.dispatch(function Fetch() {return {[name]: data} }))
      // return (state, name) => load((data) => state.dispatch(function Fetch() {return {[name]: data} }))
    }
  }

  return {
    v: version,
    h: h,
    Store: Store,
    mount: mount,
    Fetch: Fetch
  }
})()
