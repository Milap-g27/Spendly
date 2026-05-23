import React, { useState } from "react";
import { CreateGroupModal } from "./CreateGroupModal";
import { formatCurrency } from "../../lib/utils";
import { Icon } from "../Icons";

export function GroupsList({ session, navigate, useGroupsHook }) {
  const { groups, createGroup, addMember, loading, error } = useGroupsHook;
  const [modalOpen, setModalOpen] = useState(false);

  const handleCreateGroup = async (name, description, members) => {
    // 1. Create group
    const res = await createGroup(name, description);
    if (res.success && members.length > 0) {
      // 2. Add each selected member sequentially
      const groupId = res.group.id;
      for (const m of members) {
        await addMember(groupId, m.id);
      }
    }
    return res;
  };

  const handleCardClick = (groupId) => {
    navigate(`groups/${groupId}`);
  };

  return (
    <div className="screen groups-screen">
      <div className="groups-header">
        <div>
          <h2 className="groups-screen-title">Group Expenses</h2>
          <p className="groups-screen-subtitle">Split expenses easily with friends and family</p>
        </div>
        <button className="btn btn-primary btn-add-group" onClick={() => setModalOpen(true)}>
          <span className="btn-icon"><Icon name="plus" size={16} /></span>
          <span>New Group</span>
        </button>
      </div>

      {error && <p className="groups-error-bar">⚠ {error}</p>}

      {loading && groups.length === 0 ? (
        <div className="groups-loading">
          <div className="loading-spinner"></div>
          <p>Loading groups...</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="groups-empty-state card">
          <div className="empty-state-icon">
            <Icon name="split" size={48} />
          </div>
          <h3>No Groups Yet</h3>
          <p>Create a group to start splitting bills, rent, dinner, and trips with friends!</p>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            Create a Group
          </button>
        </div>
      ) : (
        <div className="groups-grid">
          {groups.map((group) => {
            const net = group.userNetBalance || 0;
            const balanceClass = net > 0.01 ? "owed" : net < -0.01 ? "owes" : "settled";

            return (
              <div
                key={group.id}
                className="group-card card ripple"
                onClick={() => handleCardClick(group.id)}
              >
                <div className="group-card-header">
                  <h3 className="group-card-name">{group.name}</h3>
                  <span className={`group-balance-tag ${balanceClass}`}>
                    {net > 0.01 ? "Owed" : net < -0.01 ? "Owes" : "Settled"}
                  </span>
                </div>

                <p className="group-card-desc">
                  {group.description || "No description provided."}
                </p>

                <div className="group-card-footer">
                  <div className="group-members-list">
                    {group.members?.slice(0, 4).map((member) => (
                      <div
                        key={member.user_id}
                        className="group-member-avatar"
                        title={member.display_name}
                      >
                        {member.display_name[0]?.toUpperCase()}
                      </div>
                    ))}
                    {group.members?.length > 4 && (
                      <div className="group-member-avatar-more">
                        +{group.members.length - 4}
                      </div>
                    )}
                  </div>

                  <div className="group-balance-detail">
                    {net > 0.01 ? (
                      <p className="group-balance-text text-green">
                        You get back <span>{formatCurrency(net)}</span>
                      </p>
                    ) : net < -0.01 ? (
                      <p className="group-balance-text text-orange">
                        You owe <span>{formatCurrency(Math.abs(net))}</span>
                      </p>
                    ) : (
                      <p className="group-balance-text text-muted">
                        No outstanding balance
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateGroupModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreateGroup}
      />
    </div>
  );
}
