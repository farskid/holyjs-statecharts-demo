import React from "react";
import logo from "./logo.svg";
import "./App.css";
import {
  Machine,
  assign
} from "xstate";
import { useMachine } from "@xstate/react";

function isEmailvalid(email) {
  return /[a-zA-Z0-9]+@[a-zA-Z0-9]+\.com/.test(
    email
  );
}

const inputStates = {
  initial: "ready",
  context: {
    value: ""
  },
  states: {
    updating: {
      entry: "saveValue",
      on: {
        "": [
          {
            target: "ready.empty",
            cond: "isEmpty"
          },
          {
            target: "ready.valid",
            cond: "isValid"
          },
          {
            target: "ready.invalid"
          }
        ]
      }
    },
    ready: {
      initial: "empty",
      on: {
        TYPE: {
          target: "updating"
        }
      },
      states: {
        empty: {},
        valid: {},
        invalid: {}
      }
    }
  }
};

const statechart = Machine(inputStates);

function App() {
  const [state, sendEvent] = useMachine(
    statechart.withConfig({
      actions: {
        saveValue: assign({
          value: (_, e) => e.data
        })
      },
      guards: {
        isEmpty: (ctx, e) =>
          ctx.value.length === 0,
        isValid: (ctx, e) =>
          isEmailvalid(ctx.value),
        isInvalid: (ctx, e) =>
          !isEmailvalid(ctx.value)
      }
    })
  );

  function onChangeHandler(e) {
    const value = e.target.value;
    sendEvent({
      type: "TYPE",
      data: value
    });
  }

  return (
    <div className="App">
      <header className="App-header">
        <pre>
          state:{" "}
          {JSON.stringify(state.value)}
        </pre>
        <pre>
          context:{" "}
          {JSON.stringify(
            state.context
          )}
        </pre>
        <input
          placeholder="enter your email here"
          type="text"
          value={state.context.value}
          onChange={onChangeHandler}
        />
        {state.matches({
          ready: "invalid"
        }) && (
          <p className="error">
            The email is invalid
          </p>
        )}
      </header>
    </div>
  );
}

export default App;
