module Hello exposing (main)

import Browser exposing (Document)
import Html exposing (a, div, li, p, text, ul)
import Html.Attributes exposing (attribute, href)
import Html.Events exposing (onClick)
import Message exposing (importableMessage)


main : Program String Model Msg
main =
    Browser.document
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
    ( { message = "Hi, I'm compiled Browser.document func through vite-plugin-elm: " ++ flags }, Cmd.none )


type Msg
    = Name String


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Name name ->
            ( { model | message = name }, Cmd.none )


view : Model -> Document Msg
view model =
    { title = "vite-elm-plugin"
    , body =
        [ div [ onClick (Name "Woooo, I'm clicked"), attribute "aria-label" "Clickable" ] [ text model.message ]
        , div [] [ text importableMessage ]
        , p [] [ text "This page works with Browser.document" ]
        , ul []
            [ li [] [ a [ href "/application.html" ] [ text "See Browser.application sample" ] ]
            , li [] [ a [ href "/elements.html" ] [ text "See Browser.element sample (works after v2.7.0-beta.1)" ] ]
            , li [] [ a [ href "/raw.html" ] [ text "See raw import sample (works after v2.8.0-beta.3)" ] ]
            ]
        ]
    }


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.none
