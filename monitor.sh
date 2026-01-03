#!/bin/bash
set -e

echo "monitor start"



while true; do
    
    
    
    
     curl -v -I https://dns.google -L -x socks5://hp40emnw108got6a67p2isj1x65qwjtz60fh5dtl7nhjhor3va:i7esr1nwxcil034gslw4sdzjyfejfvf5xiaagx4x286nw6l3ff@localhost:1080 --doh-url https://doh.opendns.com/dns-query
    
    sleep 20
       curl -v -I https://one.one.one.one -L -x socks5://hp40emnw108got6a67p2isj1x65qwjtz60fh5dtl7nhjhor3va:i7esr1nwxcil034gslw4sdzjyfejfvf5xiaagx4x286nw6l3ff@localhost:1080 --doh-url https://doh.opendns.com/dns-query
    
    
    sleep 30
done