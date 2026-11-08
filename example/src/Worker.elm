port module Worker exposing (main)


port ping : (String -> msg) -> Sub msg


port pong : String -> Cmd msg


main : Program () () Msg
main =
    Platform.worker
        { init = \_ -> ( (), Cmd.none )
        , update = update
        , subscriptions = \_ -> ping Ping
        }


type Msg
    = Ping String


update : Msg -> () -> ( (), Cmd Msg )
update msg model =
    case msg of
        Ping from ->
            ( model, pong ("Pong from Elm worker to " ++ from) )
