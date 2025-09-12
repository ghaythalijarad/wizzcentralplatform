curl -X POST https://yt0j2cdbe5.execute-api.us-east-1.amazonaws.com/dev/chat/send \
  -H "Content-Type: application/json" \
  -d '{
    "participantToken": "final_test_driver",
    "message": "🎯 FINAL TEST: This is the final verification message. Please check your WizzCentral Support interface - this message should appear in the Active Sessions!",
    "metadata": {
      "senderId": "unknown_driver_final_test",
      "senderType": "driver", 
      "senderName": "Final Test Driver",
      "platform": "flutter",
      "source": "http_api",
      "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'"
    }
  }'
