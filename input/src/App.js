import React from "react";
import logo from "./logo.svg";
import "./App.css";
import {
  Machine,
  assign,
  actions
} from "xstate";
import { useMachine } from "@xstate/react";

function isEmailvalid(email) {
  return /[a-zA-Z0-9]+@[a-zA-Z0-9]+\.com/.test(
    email
  );
}

function checkValidityService(email) {
  return new Promise(
    (resolve, reject) => {
      console.log(
        "check validity fired"
      );
      setTimeout(() => {
        Math.random() > 0.5
          ? resolve(email)
          : reject(email);
      }, 5000);
    }
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
        valid: {
          initial: "waiting",
          states: {
            waiting: {
              // Deboucing!
              after: {
                1000: "pending"
              }
            },
            pending: {
              entry:
                "initializeController",
              invoke: {
                src: "checkValid",
                onDone: "available",
                onError: "notAvailable"
              },
              exit: [
                "cancelRequest",
                "resetController"
              ]
            },
            available: {
              entry: (_, e) =>
                console.log(e.data)
            },
            notAvailable: {
              entry: (_, e) =>
                console.log(e.data)
            }
          }
        },
        invalid: {}
      }
    }
  }
};

const statechart = Machine(inputStates);

function App() {
  const [state, sendEvent] = useMachine(
    statechart.withConfig({
      services: {
        checkValid: ctx =>
          checkValidityService(
            ctx.value,
            ctx.reqCtrl.signal
          )
      },
      actions: {
        initializeController: assign({
          reqCtrl: new AbortController()
        }),
        resetController: assign({
          reqCtrl: undefined
        }),
        cancelRequest: ctx => {
          console.log(
            "Aborting validity request due to input change!"
          );
          // ctx.reqCtrl.abort();
        },
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
          <p className="warning">
            The email is invalid
          </p>
        )}
        {state.matches({
          ready: {
            valid: "pending"
          }
        }) && <p>Checking...</p>}
        {state.matches({
          ready: {
            valid: "available"
          }
        }) && (
          <p className="success">
            Email is available!
          </p>
        )}
        {state.matches({
          ready: {
            valid: "notAvailable"
          }
        }) && (
          <p className="error">
            Email is taken!
          </p>
        )}
      </header>
    </div>
  );
}

export default App;
