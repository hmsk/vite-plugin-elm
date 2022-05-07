module AnotherDescription exposing (main)

import ActualContentForAnotherDescription exposing (aboutThreePointO)
import Browser
import Html exposing (Html, div, p, text)


main : Program String Model Msg
main =
    Browser.element
        { init = \_ -> ( {}, Cmd.none )
        , update = update
        , view = view
        , subscriptions = subscriptions
        }


type alias Model =
    {}


type Msg
    = Msg


update : Msg -> Model -> ( Model, Cmd Msg )
update _ model =
    ( model, Cmd.none )


view : Model -> Html Msg
view _ =
    div
        []
        [ p [] [ text aboutThreePointO ]
        ]


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.none
