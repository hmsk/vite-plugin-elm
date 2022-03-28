module Application exposing (..)

import Browser
import Html exposing (Html, div, h1, h2, img, text)
import Html.Attributes exposing (src, width)



---- MODEL ----


type alias Model =
    {}


init : ( Model, Cmd Msg )
init =
    ( {}, Cmd.none )



---- UPDATE ----


type Msg
    = NoOp


update : Msg -> Model -> ( Model, Cmd Msg )
update _ model =
    ( model, Cmd.none )



---- VIEW ----


view : Model -> Html Msg
view _ =
    div []
        [ h1 [] [ text "Your Elm App is working!" ]
        , h2 [] [ text "import static assets via vite" ]
        , img [ src "[ELM_VITE_PLUGIN_ASSET_PATH_STATIC:../assets/logo.jpg]", width 128 ] []
        , h2 [] [ text "import dynamic assets via vite" ]
        , img [ src "[ELM_VITE_PLUGIN_ASSET_PATH_DYNAMIC:/assets/logo.jpg]", width 128 ] []
        , img [ src "[ELM_VITE_PLUGIN_ASSET_PATH_DYNAMIC:/assets/logo.png]", width 128 ] []
        ]



---- PROGRAM ----


main : Program () Model Msg
main =
    Browser.application
        { view = \model -> { title = "Test", body = [ view model ] }
        , init = \_ _ _ -> ( {}, Cmd.none )
        , update = \_ model -> ( model, Cmd.none )
        , subscriptions = always Sub.none
        , onUrlRequest = \_ -> NoOp
        , onUrlChange = \_ -> NoOp
        }
