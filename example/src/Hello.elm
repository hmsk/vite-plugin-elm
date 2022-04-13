module Hello exposing (main)

import Browser
import Html exposing (Html, a, div, text)
import Html.Attributes exposing (href, attribute)
import Html.Events exposing (onClick)
import Message exposing (importableMessage)


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
init flags =
    ( { message = "Hi, I'm compiled Browser.element func through vite-plugin-elm: " ++ flags }, Cmd.none )


type Msg
    = Name String


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Name name ->
            ( { model | message = name }, Cmd.none )


view : Model -> Html Msg
view model =
    div []
        [ div [ onClick (Name "Woooo, I'm clicked"), attribute "aria-label" "Clickable" ] [ text model.message ]
        , div [] [ text importableMessage ]
        , a [ href "/application/" ] [ text "See Browser.Application sample" ]
        ]


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.none
