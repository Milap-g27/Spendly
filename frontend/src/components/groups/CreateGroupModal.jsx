import React, { useState, useEffect, useCallback } from "react";
import { searchUsers } from "../../services/groups";
import { Icon } from "../Icons";

export function CreateGroupModal({ isOpen, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearching(true);
      setError("");
      try {
        const results = await searchUsers(searchQuery.trim());
        // Filter out already selected members
        const filtered = (results || []).filter(
          r => !selectedMembers.some(m => m.id === r.id)
        );
        setSearchResults(filtered);
      } catch (err) {
        console.error("Error searching users:", err);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, selectedMembers]);

  if (!isOpen) return null;

  const handleSelectMember = (user) => {
    setSelectedMembers([...selectedMembers, user]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleRemoveMember = (userId) => {
    setSelectedMembers(selectedMembers.filter(m => m.id !== userId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Group name is required");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await onCreate(name.trim(), description.trim(), selectedMembers);
      if (res.success) {
        // Reset and close
        setName("");
        setDescription("");
        setSelectedMembers([]);
        onClose();
      } else {
        setError(res.error || "Failed to create group");
      }
    } catch (err) {
      setError(err.message || "Failed to create group");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="create-group-overlay show" onClick={onClose}>
      <div className="create-group-modal" onClick={(e) => e.stopPropagation()}>
        <div className="create-group-header">
          <h3 className="create-group-title">Create New Group</h3>
          <button className="create-group-close" onClick={onClose}>
            <Icon name="close" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-group-form">
          {error && <p className="create-group-error">⚠ {error}</p>}

          <div className="form-group">
            <label className="form-label" htmlFor="group-name">Group Name</label>
            <input
              id="group-name"
              type="text"
              className="form-input"
              placeholder="e.g. Goa Trip, Flatmates"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="group-desc">Description (Optional)</label>
            <input
              id="group-desc"
              type="text"
              className="form-input"
              placeholder="e.g. Shared expenses for Goa trip"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Add Members (Search by Email)</label>
            <div className="search-input-wrapper">
              <input
                type="email"
                className="form-input search-input"
                placeholder="Enter member's email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={submitting}
              />
              <span className="search-input-icon">
                <Icon name="search" size={18} />
              </span>
            </div>

            {/* Selected Members Chips */}
            {selectedMembers.length > 0 && (
              <div className="selected-members-container">
                {selectedMembers.map((member) => (
                  <span key={member.id} className="member-chip">
                    <span className="member-chip-avatar">
                      {member.display_name[0]?.toUpperCase()}
                    </span>
                    <span className="member-chip-name">{member.display_name}</span>
                    <button
                      type="button"
                      className="member-chip-remove"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      <Icon name="close" size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search Results Dropdown */}
            {searchQuery && (
              <div className="search-results-dropdown">
                {searching ? (
                  <div className="search-results-info">Searching...</div>
                ) : searchResults.length === 0 ? (
                  <div className="search-results-info">No registered users found</div>
                ) : (
                  searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      className="search-result-item"
                      onClick={() => handleSelectMember(user)}
                    >
                      <div className="search-result-avatar">
                        {user.display_name[0]?.toUpperCase()}
                      </div>
                      <div className="search-result-info">
                        <p className="search-result-name">{user.display_name}</p>
                        <p className="search-result-email">{user.email}</p>
                      </div>
                      <span className="search-result-add-icon">
                        <Icon name="plus" size={16} />
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="create-group-footer">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? "Creating..." : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
