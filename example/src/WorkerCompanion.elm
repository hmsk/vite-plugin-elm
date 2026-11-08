module WorkerCompanion exposing (main)

import Browser
import Html exposing (p, text)


type Msg
    = NoOp


main : Program () () Msg
main =
    Browser.element
        { init = \_ -> ( (), Cmd.none )
        , update = \_ model -> ( model, Cmd.none )
        , view = \_ -> p [] [ text "Browser.element bundled with Platform.worker" ]
        , subscriptions = \_ -> Sub.none
        }
