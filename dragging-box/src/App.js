import React from "react";
import logo from "./logo.svg";
import "./App.css";
import {
  Machine,
  assign
} from "xstate";
import { useMachine } from "@xstate/react";

function getShifts(
  event,
  boxRef
) {
  return {
    x:
      event.clientX -
      boxRef.current.getBoundingClientRect()
        .left,
    y:
      event.clientY -
      boxRef.current.getBoundingClientRect()
        .top
  };
}

const boxStates = {
  initial: "released",
  context: {
    shiftX: 0,
    shiftY: 0,
    pageX: 0,
    pageY: 0
  },
  states: {
    released: {
      on: {
        GRAB: {
          target: "grabbed"
        }
      }
    },
    grabbed: {
      entry: [
        "saveShiftPoints",
        "saveBoxPositions",
        "prepareBoxStyles",
        "moveBox"
      ],
      on: {
        MOVE: "dragging"
      }
    },
    dragging: {
      entry: [
        "saveBoxPositions",
        "moveBox"
      ],
      on: {
        MOVE: "dragging",
        RELEASE: "released"
      }
    }
  }
};

const statechart = Machine(
  boxStates
);

function App() {
  const boxRef = React.useRef();
  const [
    state,
    sendEvent
  ] = useMachine(
    statechart.withConfig({
      actions: {
        saveShiftPoints: assign(
          {
            shiftX: (_, e) =>
              e.data.shiftX,
            shiftY: (_, e) =>
              e.data.shiftY
          }
        ),
        saveBoxPositions: assign(
          {
            pageX: (_, e) =>
              e.data.pageX,
            pageY: (_, e) =>
              e.data.pageY
          }
        ),
        prepareBoxStyles: () => {
          boxRef.current.style.position =
            "absolute";
          boxRef.current.style.zIndex =
            "1000";
        },
        moveBox: ctx => {
          boxRef.current.style.left =
            ctx.pageX -
            ctx.shiftX +
            "px";
          boxRef.current.style.top =
            ctx.pageY -
            ctx.shiftY +
            "px";
        }
      }
    })
  );

  return (
    <div className="App">
      <header className="App-header">
        <pre>
          state:
          {JSON.stringify(
            state.value
          )}
        </pre>
        <pre>
          context:
          {JSON.stringify(
            state.context
          )}
        </pre>
        <div className="container">
          <div
            ref={boxRef}
            className={`box ${state.value}`}
            onMouseMove={e => {
              sendEvent({
                type: "MOVE",
                data: {
                  pageX:
                    e.pageX,
                  pageY:
                    e.pageY
                }
              });
            }}
            onMouseDown={e => {
              const {
                x: shiftX,
                y: shiftY
              } = getShifts(
                e,
                boxRef
              );

              sendEvent({
                type: "GRAB",
                data: {
                  shiftX,
                  shiftY
                }
              });
            }}
            onMouseUp={() => {
              sendEvent(
                "RELEASE"
              );
            }}
          />
        </div>
      </header>
    </div>
  );
}

export default App;
