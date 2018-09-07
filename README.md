# radi-pure

This is **Radi** core idea but user interface is as a pure functions. If this proves to be better than current Radi solutions, this will become Radi v1.0.

Experimental stuff!! You should not use it in production.

## Examples

Heres some very basic example of how components and rendering looks.

```jsx
/** @jsx h **/
const { h, mount } = RadiExperiment

function Hello() {
  return (
    <h1>Hello World !</h1>
  )
}

mount(<Hello/>, document.body)
```

```jsx
/** @jsx h **/
const { h, mount, Store } = RadiExperiment

/* Firstly we define state */
const state = new Store({
  count: 0
})

/* Then we define some actions that will change state */
const up = ({count}, by) => ({count: count + by})
const down = ({count}, by) => ({count: count - by})

/* Then comes pure function component */
function Counter() {
  return (
    <div>
      <h1>{ state.render(s => s.count) }</h1>
      <button onclick={ () => state.dispatch(up, 1) }>Up</button>
      <button onclick={ () => state.dispatch(down, 1) }>Down</button>
    </div>
  )
}

/* Finally we mount it */
mount(<Counter/>, document.body)
```

So now everything is based on pure functions. Testing can be quite easy now. Only thing to test is output of functions.
Imagine this:

```jsx
const mockState = { count: 0 };

expect(Hello()).toBe('<h1>Hello World !</h1>')
expect(up(mockState, 1)).toBe(1)
expect(down(mockState, 1)).toBe(0)
expect(up(mockState, 10)).toBe(10)
expect(down(mockState, 10)).toBe(0)
```

Also not losing any of the responsiveness. For example lifecycles, totally there!

```jsx
const state = new Store({
  person: {
    name: 'John Doe'
  }
})

function App() {
  this.onMount = () => {}
  this.onDestroy = () => {}

  state.map(s => s.person).subscribe(({name}) => {
    console.log('Persons name changed to', name)
  })

  return <Person/>
}
```

## Stay In Touch

- [Twitter](https://twitter.com/radi_js)
- [Slack](https://join.slack.com/t/radijs/shared_invite/enQtMjk3NTE2NjYxMTI2LWFmMTM5NTgwZDI5NmFlYzMzYmMxZjBhMGY0MGM2MzY5NmExY2Y0ODBjNDNmYjYxZWYxMjEyNjJhNjA5OTJjNzQ)

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2018-present, Marcis (Marcisbee) Bergmanis
