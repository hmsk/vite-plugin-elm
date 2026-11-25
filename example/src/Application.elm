module Application exposing (..)

import Browser
import Browser.Navigation as Nav
import Html exposing (Html, a, button, div, h1, h2, h3, img, p, text)
import Html.Attributes exposing (alt, attribute, href, src, width)
import Html.Events exposing (onClick)
import Url exposing (Url)
import VitePluginHelper exposing (asset)



---- MODEL ----


type alias Model =
    { key : Nav.Key
    , url : Url
    , clicks : Int
    }


init : () -> Url -> Nav.Key -> ( Model, Cmd Msg )
init _ url key =
    ( { key = key, url = url, clicks = 0 }, Cmd.none )



---- UPDATE ----


type Msg
    = Clicked
    | UrlRequested Browser.UrlRequest
    | UrlChanged Url


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Clicked ->
            ( { model | clicks = model.clicks + 1 }, Cmd.none )

        UrlRequested (Browser.Internal url) ->
            ( model, Nav.pushUrl model.key (Url.toString url) )

        UrlRequested (Browser.External href) ->
            ( model, Nav.load href )

        UrlChanged url ->
            ( { model | url = url }, Cmd.none )



---- VIEW ----


view : Model -> Html Msg
view model =
    div []
        [ h1 [] [ text "Your Elm App is working!" ]
        , h2 [] [ text "navigate within the app" ]
        , button [ onClick Clicked, attribute "aria-label" "Count" ] [ text "Count" ]
        , p [] [ text ("Clicked " ++ String.fromInt model.clicks ++ " times") ]
        , a [ href "#moved" ] [ text "Move" ]
        , p [] [ text ("Fragment: " ++ Maybe.withDefault "none" model.url.fragment) ]
        , h2 [] [ text "import assets via vite" ]
        , h3 [] [ text "Without option" ]
        , img [ src "[VITE_PLUGIN_ELM_ASSET:/assets/logo.jpg]", width 128, alt "without option" ] []
        , h3 [] [ text "With inline option" ]
        , img [ src "[VITE_PLUGIN_ELM_ASSET:/assets/logo.png?inline]", width 128, alt "with inline option" ] []
        , h3 [] [ text "With vite-plugin-helper" ]
        , img [ src <| asset "/assets/logo.png?inline", width 128, alt "with vite-plugin-helper" ] []
        ]



---- PROGRAM ----


main : Program () Model Msg
main =
    Browser.application
        { view = \model -> { title = "Test", body = [ view model ] }
        , init = init
        , update = update
        , subscriptions = always Sub.none
        , onUrlRequest = UrlRequested
        , onUrlChange = UrlChanged
        }
