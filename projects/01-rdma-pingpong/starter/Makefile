CC ?= cc
PKG_CONFIG ?= pkg-config

CPPFLAGS += -Iinclude -D_DEFAULT_SOURCE -D_POSIX_C_SOURCE=200809L
CFLAGS ?= -std=c11 -O2 -g
CFLAGS += -Wall -Wextra -Wpedantic
VERBS_CFLAGS := $(shell $(PKG_CONFIG) --cflags libibverbs 2>/dev/null)
VERBS_LIBS := $(shell $(PKG_CONFIG) --libs libibverbs 2>/dev/null || printf '%s' '-libverbs')

BUILD_DIR := build
BIN_DIR := bin

COMMON_OBJS := $(BUILD_DIR)/protocol.o $(BUILD_DIR)/common.o

.PHONY: all test clean

all: $(BIN_DIR)/rdma-pingpong-server $(BIN_DIR)/rdma-pingpong-client

$(BUILD_DIR) $(BIN_DIR):
	mkdir -p $@

$(BUILD_DIR)/protocol.o: src/protocol.c include/rdma_pingpong.h | $(BUILD_DIR)
	$(CC) $(CPPFLAGS) $(CFLAGS) -c $< -o $@

$(BUILD_DIR)/common.o: src/common.c src/common.h include/rdma_pingpong.h | $(BUILD_DIR)
	$(CC) $(CPPFLAGS) $(CFLAGS) $(VERBS_CFLAGS) -c $< -o $@

$(BUILD_DIR)/server.o: src/server.c src/common.h include/rdma_pingpong.h | $(BUILD_DIR)
	$(CC) $(CPPFLAGS) $(CFLAGS) $(VERBS_CFLAGS) -c $< -o $@

$(BUILD_DIR)/client.o: src/client.c src/common.h include/rdma_pingpong.h | $(BUILD_DIR)
	$(CC) $(CPPFLAGS) $(CFLAGS) $(VERBS_CFLAGS) -c $< -o $@

$(BUILD_DIR)/test_protocol.o: tests/test_protocol.c include/rdma_pingpong.h | $(BUILD_DIR)
	$(CC) $(CPPFLAGS) $(CFLAGS) -c $< -o $@

$(BIN_DIR)/rdma-pingpong-server: $(COMMON_OBJS) $(BUILD_DIR)/server.o | $(BIN_DIR)
	$(CC) $(CFLAGS) $^ $(VERBS_LIBS) -o $@

$(BIN_DIR)/rdma-pingpong-client: $(COMMON_OBJS) $(BUILD_DIR)/client.o | $(BIN_DIR)
	$(CC) $(CFLAGS) $^ $(VERBS_LIBS) -o $@

$(BIN_DIR)/test-protocol: $(BUILD_DIR)/protocol.o $(BUILD_DIR)/test_protocol.o | $(BIN_DIR)
	$(CC) $(CFLAGS) $^ -o $@

test: $(BIN_DIR)/test-protocol
	$(BIN_DIR)/test-protocol

clean:
	$(RM) -r $(BUILD_DIR) $(BIN_DIR)
