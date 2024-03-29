#!/bin/bash
BASE_DIR=$(dirname "$0")
OUTPUT=$BASE_DIR/requestShark.xpi

if test -f $OUTPUT; then
	rm -rf $OUTPUT
fi
cd $BASE_DIR/src; zip -r ../$OUTPUT *
