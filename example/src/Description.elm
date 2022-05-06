module Description exposing (main)

import Browser
import Html exposing (Html, p, text)


main : Program String Model Msg
main =
    Browser.element
        { init = init
        , update = update
        , view = view
        , subscriptions = subscriptions
        }


type alias Model =
    { message : String
    }


init : String -> ( Model, Cmd Msg )
init initialMesssage =
    ( { message = initialMesssage }, Cmd.none )


type Msg
    = Name String


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Name name ->
            ( { model | message = name }, Cmd.none )


view : Model -> Html Msg
view model =
    p [] [ text model.message ]


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.none
